use std::error::Error;

use postgres::{Client, NoTls};

use crate::item::Item;
use crate::player::{Player, MoveItem};

#[derive(Debug)]
pub struct Inventory {
	pub items: Vec<Item>,
}


impl Inventory {
	pub fn new() -> Inventory {
		let mut client = Client::connect("postgresql://mc-inventory:pineapple@localhost", NoTls).unwrap();
		let items = client.query("SELECT metadata, nbt, name, display_name, stack_size, count, chest_x, chest_y, chest_z, slot FROM items", &[]).unwrap().iter().map( 
			|row| Item { 
		        metadata: row.get(0),
		        nbt: row.get(1),
		        name: row.get(2),
		        display_name: row.get(3),
		        stack_size: row.get(4),
		        count: row.get(5),
		        chest_x: row.get(6),
		        chest_y: row.get(7),
		        chest_z: row.get(8),
		        slot: row.get(9), 
			}
		).collect();


		Inventory { items }

	}



	pub fn take_inventory() -> Inventory {

		let player = Player::new();

		let mut client = Client::connect("postgresql://mc-inventory:pineapple@localhost", NoTls).unwrap();

		client.execute("truncate table items", &[]);

		let mut items = vec![];

		for chest in Inventory::inventory_spaces().iter() {
			player.move_position(&[chest[0], chest[2]+1]);
			
			let mut chest_items = match player.open(&chest) {
			    Ok(x) => x,
			    Error => panic!("Could not open chest: {:?}", &chest)
			};


	        for item in &chest_items {
	            let r = client.execute(
	                "INSERT INTO items (metadata, name, display_name, stack_size, slot, count, nbt, chest_x, chest_y, chest_z) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
	                &[&item.metadata, &item.name, &item.display_name, &item.stack_size, &item.slot, &item.count, &item.nbt, &item.chest_x, &item.chest_y, &item.chest_z],
	            );
            	println!("{:?}", r);
	            match r {
	            	Ok(_) => (),
	            	Error => panic!("Could not insert item into table")
	            }
	        }
	        items.append(&mut chest_items);
		}




		Inventory { items }

        // self.items = items;

	}


 

	pub fn deposit(&self, chest: [i32; 3]) {
		let player = Player::new();

		player.move_position(&[chest[0]+2, chest[2]]);


		let to_deposit = match player.open(&chest) {
		    Ok(x) => x,
		    Error => panic!("Could not open deposit chest")
		};

		let empty = self.empty_slots();

		let items: Vec<_> = to_deposit.iter().zip(empty.iter()).collect();

		let commands: Vec<_> = items.iter().map(|item| MoveItem {
			from_chest: [item.0.chest_x,item.0.chest_y, item.0.chest_z],
			from_chest_pos: Inventory::chest_position(&[item.0.chest_x,item.0.chest_y, item.0.chest_z]),
    		from_slot: item.0.slot,
    		to_chest: item.1.0,
			to_chest_pos: Inventory::chest_position(&item.1.0), 
    		to_slot: item.1.1,
    		amount: item.0.count,
		}).collect();

		println!("{:?}", commands);
		player.run(commands);


		let mut client = Client::connect("postgresql://mc-inventory:pineapple@localhost", NoTls).unwrap();

		for item in items {
		    let r = client.execute(
                "INSERT INTO items (metadata, name, display_name, stack_size, slot, count, nbt, chest_x, chest_y, chest_z) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
                &[&item.0.metadata, &item.0.name, &item.0.display_name, &item.0.stack_size, &item.1.1, &item.0.count, &item.0.nbt, &item.1.0[0], &item.1.0[1], &item.1.0[2]],
            );
        	match r {
            	Ok(_) => (),
            	Error => panic!("Could not insert item into table")
            }

		}


	}

	pub fn withdraw(&self, items: Vec<Item>, chest: [i32; 3]) -> Result<(), Box<dyn Error>>{

		let mut client = Client::connect("postgresql://mc-inventory:pineapple@localhost", NoTls).unwrap();

		let mut commands = vec![];
		let mut open_slot = 0;

		for item in items {
			let stored_items: Vec<_> = client.query("SELECT metadata, nbt, name, display_name, stack_size, count, chest_x, chest_y, chest_z, slot FROM items WHERE name=$1 AND metadata=$2 AND nbt=$3", &[&item.name, &item.metadata, &item.nbt]).unwrap().iter().map( 
				|row| Item { 
			        metadata: row.get(0),
			        nbt: row.get(1),
			        name: row.get(2),
			        display_name: row.get(3),
			        stack_size: row.get(4),
			        count: row.get(5),
			        chest_x: row.get(6),
			        chest_y: row.get(7),
			        chest_z: row.get(8),
			        slot: row.get(9), 
				}
			).collect();

			let mut remaining = item.count;

			for stored_item in stored_items {

				if remaining == 0 {
					break;
				}

				let amount = if remaining >= stored_item.count {
					stored_item.count  
				} else {
					remaining  
				};

				commands.push(MoveItem {
					from_chest: [stored_item.chest_x,stored_item.chest_y, stored_item.chest_z],
					from_chest_pos: Inventory::chest_position(&[stored_item.chest_x,stored_item.chest_y, stored_item.chest_z]),
		    		from_slot: stored_item.slot,
		    		to_chest: chest,
					to_chest_pos: Inventory::chest_position(&chest), 
		    		to_slot: open_slot,
		    		amount,
				});

				remaining -= amount;
				open_slot += 1;

	            client.execute(
	                "UPDATE items SET count = $1 WHERE metadata=$2 and name=$3 and display_name=$4 and stack_size=$5 and slot=$6 and count=$7 and nbt=$8 and chest_x=$9 and chest_y=$10 and chest_z=$11",
	                &[&amount, &item.metadata, &item.name, &item.display_name, &item.stack_size, &item.slot, &item.count, &item.nbt, &item.chest_x, &item.chest_y, &item.chest_z],
	            )?;



			}


		}



		println!("{:?}", commands);

		let player = Player::new();
		player.run(commands)?;

        client.execute("DELETE items WHERE count = 0", &[])?;


		// let row = client.query("SELECT metadata, name, display_name, stack_size, slot, count, nbt, chest_x, chest_y, chest_z FROM items WHERE name='coal_ore' AND metadata=0 AND nbt='null'", &[]);
		// println!("{:?}", row);

		// Search database for item and location
		
		// Return error if item not found

		// Send item list to player

		Ok(())

	}

	pub fn confirm(&self) {
		unimplemented!();
	}


	pub fn inventory_spaces() -> Vec<[i32; 3]> {

		let offset = [186, 78, 174];
		let height = 6;
		let rows = 3;
		let depth = 3;


		let mut spaces = vec![];
		for i_row in 0..rows {
			for i_depth in 0..depth {
				for i_height in 0..height {
					spaces.push([i_depth, i_height, i_row*-3]);
				}
			}
		} 
	

		spaces.iter().map(|s| [s[0] + offset[0], s[1] + offset[1], s[2] + offset[2]]).collect()
	
	}

	fn empty_slots(&self) -> Vec<([i32; 3], i32)> {
		let available = Inventory::inventory_spaces();

		let filled = self.items.iter()
			.map( |i| ([i.chest_x, i.chest_y, i.chest_z], i.slot))
			.collect::<Vec<_>>();

		let mut empty = vec![];

		for chest in available {
			for i in 0..54 {
				if !filled.contains(&(chest, i)) {
					empty.push((chest, i));
				}
			}
		}

		empty

	}

	fn chest_position(chest: &[i32; 3]) -> [i32; 2] {

		if chest[0] >= 186 && chest[2] <= 174 {
			[chest[0],  chest[2]+1]
		} else if chest[0] == 182 {
     		[chest[0]+2, chest[2]]
		} else {
			unimplemented!()
		}

	}
	
}