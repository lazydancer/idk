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
		let items = client.query("SELECT code, metadata, nbt, name, display_name, stack_size, count, chest_x, chest_y, chest_z, slot FROM items", &[]).unwrap().iter().map( 
			|row| Item { 
	    		code: row.get(0),
		        metadata: row.get(1),
		        nbt: row.get(2),
		        name: row.get(3),
		        display_name: row.get(4),
		        stack_size: row.get(5),
		        count: row.get(6),
		        chest_x: row.get(7),
		        chest_y: row.get(8),
		        chest_z: row.get(9),
		        slot: row.get(10), 
			}
		).collect();


		Inventory { items }

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

	pub fn take_inventory() -> Inventory {

		let player = Player::new();

		let mut client = Client::connect("postgresql://mc-inventory:pineapple@localhost", NoTls).unwrap();

		client.execute("truncate table items", &[]);

		let mut items = vec![];

		for chest in Inventory::inventory_spaces().iter() {
			player.move_position(&[chest[0], chest[2]+1]);
			let mut chest_items = player.open(chest);
	        for item in &chest_items {
	            client.execute(
	                "INSERT INTO items (code, metadata, name, display_name, stack_size, slot, count, nbt, chest_x, chest_y, chest_z) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
	                &[&item.code, &item.metadata, &item.name, &item.display_name, &item.stack_size, &item.slot, &item.count, &item.nbt, &item.chest_x, &item.chest_y, &item.chest_z],
	            );
	        }
	        items.append(&mut chest_items);
		}




		Inventory { items }

        // self.items = items;

	}

	pub fn deposit(&self, chest: [i32; 3]) {
		let player = Player::new();
		let to_deposit: Vec<Item> = player.open(&chest);

		println!("{:?}", &to_deposit);

		let empty = self.empty_slots();

		let it = to_deposit.iter().zip(empty.iter());

		let commands: Vec<_> = it.map(|i| MoveItem {
			from_chest: [i.0.chest_x,i.0.chest_y, i.0.chest_z],
    		from_slot: i.0.slot,
    		to_chest: i.1.0,
    		to_slot: i.1.1,
    		amount: i.0.count,
		}).collect();

		println!("{:?}", commands);
		player.run(commands);

	}

	pub fn withdraw(&self, items: Vec<Item>, chest: [i32; 3]) {
		unimplemented!();
	}

	pub fn confirm(&self) {
		unimplemented!();
	}

	fn empty_slots(&self) -> Vec<([i32; 3], i32)> {
		let available = vec![[9, 83, 153], [9, 84, 153]];

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
}