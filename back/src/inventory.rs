use std::error::Error;

use rocket::tokio;
use tokio_postgres;
use tokio_postgres::NoTls;
use serde::{Deserialize, Serialize};


use std::collections::HashMap;

use serde_json::Value;


use crate::player::{Player, MoveItem};
use crate::item::Item;


#[derive(Debug, Serialize)]
pub struct Inventory {
	pub items: Vec<Item>,
}


impl Inventory {
	pub async fn init() -> Result<Inventory, tokio_postgres::Error> {
		let (client, connection) = tokio_postgres::connect("postgresql://mc-inventory:pineapple@localhost", NoTls).await?;
		
		tokio::spawn(async move {
        	if let Err(e) = connection.await {
            	eprintln!("connection error: {}", e);
        	}
    	});

		let items = client.query("SELECT metadata, nbt, name, display_name, stack_size, count, chest_x, chest_y, chest_z, slot FROM items", &[]).await.unwrap().iter().map( 
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


		Ok(Inventory { items })

	}


	pub async fn take_inventory() -> Result<Inventory, tokio_postgres::Error> {

		let player = Player::new();

		let (client, connection) = tokio_postgres::connect("postgresql://mc-inventory:pineapple@localhost", NoTls).await?;
		
		tokio::spawn(async move {
        	if let Err(e) = connection.await {
            	eprintln!("connection error: {}", e);
        	}
    	});

		client.execute("truncate table items", &[]).await?;

		let mut items = vec![];

		for chest in Inventory::inventory_spaces().iter() {
			player.move_position(&[chest[0]+1, chest[2]]);
			
			let mut chest_items = match player.open(&chest) {
			    Ok(x) => x,
			    Error => panic!("Could not open chest: {:?}", &chest)
			};


	        for item in &chest_items {
	            let r = client.execute(
	                "INSERT INTO items (metadata, name, display_name, stack_size, slot, count, nbt, chest_x, chest_y, chest_z) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
	                &[&item.metadata, &item.name, &item.display_name, &item.stack_size, &item.slot, &item.count, &item.nbt, &item.chest_x, &item.chest_y, &item.chest_z],
	            ).await?;
	        }
	        items.append(&mut chest_items);
		}




		Ok(Inventory { items })

        // self.items = items;

	}


	pub async fn list() -> Result<Vec<Item>, tokio_postgres::Error> {
		let (client, connection) = tokio_postgres::connect("postgresql://mc-inventory:pineapple@localhost", NoTls).await?;	

		tokio::spawn(async move {
        	if let Err(e) = connection.await {
            	eprintln!("connection error: {}", e);
        	}
    	});

		let items: Vec<Item> = client.query("SELECT metadata, nbt, name, MAX(display_name), SUM(count) FROM items GROUP BY metadata, nbt, name", &[]).await.unwrap().iter().map( |row| {
			
			println!("{:?}", row);
			
			Item::new_without_location(
				row.get(0), // metadata
		        row.get(1), // nbt
		        row.get(2), // name
		        row.get(3), // display_name
		        row.get(4), // count
			)
		}

		).collect();

		Ok(items)
	}


	// pub fn deposit(&self, chest: [i32; 3]) {
	// 	let player = Player::new();

	// 	player.move_position(&[chest[0]+2, chest[2]]);


	// 	let to_deposit = match player.open(&chest) {
	// 	    Ok(x) => x,
	// 	    Error => panic!("Could not open deposit chest")
	// 	};

	// 	let empty = self.empty_slots();

	// 	let items: Vec<_> = to_deposit.iter().zip(empty.iter()).collect();

	// 	let commands: Vec<_> = items.iter().map(|item| MoveItem {
	// 		from_chest: [item.0.chest_x,item.0.chest_y, item.0.chest_z],
	// 		from_chest_pos: Inventory::chest_position(&[item.0.chest_x,item.0.chest_y, item.0.chest_z]),
 //    		from_slot: item.0.slot,
 //    		from_amount: item.0.count,
 //    		to_chest: item.1.0,
	// 		to_chest_pos: Inventory::chest_position(&item.1.0), 
 //    		to_slot: item.1.1,
 //    		amount: item.0.count,
	// 	}).collect();

	// 	println!("{:?}", commands);


	// 	player.run(commands);


	// 	let mut client = Client::connect("postgresql://mc-inventory:pineapple@localhost", NoTls).unwrap();

	// 	for item in items {
	// 	    let r = client.execute(
 //                "INSERT INTO items (metadata, name, display_name, stack_size, slot, count, nbt, chest_x, chest_y, chest_z) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
 //                &[&item.0.metadata, &item.0.name, &item.0.display_name, &item.0.stack_size, &item.1.1, &item.0.count, &item.0.nbt, &item.1.0[0], &item.1.0[1], &item.1.0[2]],
 //            );
 //        	match r {
 //            	Ok(_) => (),
 //            	Error => panic!("Could not insert item into table")
 //            }

	// 	}


	// }

	pub async fn withdraw(&self, items: Vec<Item>, chest: [i32; 3]) -> Result<(), Box<dyn Error>>{


		let items = self.find(items).unwrap();


		let mut commands = vec![];

		let (client, connection) = tokio_postgres::connect("postgresql://mc-inventory:pineapple@localhost", NoTls).await?;
		
		tokio::spawn(async move {
        	if let Err(e) = connection.await {
            	eprintln!("connection error: {}", e);
        	}
    	});


		let mut open_slot = 0;
		for item in items {
			let stored_items: Vec<_> = client.query("SELECT metadata, nbt, name, display_name, stack_size, count, chest_x, chest_y, chest_z, slot FROM items WHERE name=$1 AND metadata=$2 AND nbt=$3", &[&item.name, &item.metadata, &item.nbt]).await.unwrap().iter().map( 
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
		    		from_amount: stored_item.count,
		    		to_chest: chest,
					to_chest_pos: Inventory::chest_position(&chest), 
		    		to_slot: open_slot,
		    		amount,
				});

				remaining -= amount;
				open_slot += 1;

	            client.execute(
	                "UPDATE items SET count = $1 WHERE slot=$2 and chest_x=$3 and chest_y=$4 and chest_z=$5",
	                &[&(stored_item.count - amount), &stored_item.slot, &stored_item.chest_x, &stored_item.chest_y, &stored_item.chest_z],
	            ).await;



			}


		}


		println!("{:?}", commands);

		let player = Player::new();
		player.run(commands)?;

        client.execute("DELETE FROM items WHERE count = 0", &[]);


		Ok(())

	}


	// Helpper functions

	// Private, public for testing
	pub fn find(&self, items: Vec<Item>) -> Result<Vec<Item>, Box<dyn Error>> {
		let mut result: Vec<Item> = vec![];
		for item in items {
			let mut count = item.count;

			let inv_items = self.items.clone();

			for mut inventory_item in inv_items.into_iter().filter(|i| i.matches(&item)) {
				
				if count > inventory_item.count {
	 				count -= inventory_item.count;
					result.push(inventory_item)
				} else {
					//partial stack
					inventory_item.count = count;
					result.push(inventory_item);
					continue;
				}
	 		
	 		}
		
		}

		println!("{:?}", result);

		Ok(result)
	}


	pub fn inventory_spaces() -> Vec<[i32; 3]> {

		let offset = [17, 83, 127];
		let height = 6;
		let rows = 3;
		let depth = 7;


		let mut spaces = vec![];
		for i_row in 0..rows {
			for i_depth in 0..depth {
				for i_height in 0..height {
					spaces.push([i_row*3, i_height, -i_depth]);
				}
			}
		} 
	

		spaces.iter().map(|s| [s[0] + offset[0], s[1] + offset[1], s[2] + offset[2]]).collect()
	
	}

	// fn empty_slots(&self) -> Vec<([i32; 3], i32)> {
	// 	let available = Inventory::inventory_spaces();

	// 	let filled = self.items.iter()
	// 		.map( |i| ([i.chest_x, i.chest_y, i.chest_z], i.slot))
	// 		.collect::<Vec<_>>();

	// 	let mut empty = vec![];

	// 	for chest in available {
	// 		for i in 0..54 {
	// 			if !filled.contains(&(chest, i)) {
	// 				empty.push((chest, i));
	// 			}
	// 		}
	// 	}

	// 	empty

	// }

	fn chest_position(chest: &[i32; 3]) -> [i32; 2] {

		if chest[2] <= 128 {
			[chest[0]+1,  chest[2]]
		} else {
			[chest[0],  chest[2]-1]
		}

	}
	



}




	
