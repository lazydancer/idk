#[cfg(test)]
mod tests {

	#[test]
	fn it_works() {
		let result = 2 + 2;
		assert_eq!(result, 4);
	} 

	use crate::inventory::Inventory;
	use crate::item::Item;
	use serde_json::Value;


	#[test]
	fn item_equal() {
		let a = Item { 
				metadata: 0,
	            nbt: Value::Null,
	            name: "stone".to_string(),
	            display_name: "Stone".to_string(),
	            stack_size: 64,
	            count: 5,
	            chest_x: 0,
	            chest_y: 0,
	            chest_z: 0,
	            slot: 0,
			};
		let b = Item { 
				metadata: 0,
	            nbt: Value::Null,
	            name: "stone".to_string(),
	            display_name: "Stone".to_string(),
	            stack_size: 64,
	            count: 4,
	            chest_x: 0,
	            chest_y: 0,
	            chest_z: 0,
	            slot: 1,

			};

		assert!(a.matches(&b))

	}

	#[test]
	fn locate() {
		let inventory = Inventory { items: vec![
			Item { 
				metadata: 0,
	            nbt: Value::Null,
	            name: "stone".to_string(),
	            display_name: "Stone".to_string(),
	            stack_size: 64,
	            count: 5,
	            chest_x: 0,
	            chest_y: 0,
	            chest_z: 0,
	            slot: 0,
			},
			Item { 
				metadata: 0,
	            nbt: Value::Null,
	            name: "stone".to_string(),
	            display_name: "Stone".to_string(),
	            stack_size: 64,
	            count: 4,
	            chest_x: 0,
	            chest_y: 0,
	            chest_z: 0,
	            slot: 1,

			},
		]};


		let items_to_get = inventory.find(vec![
			Item { 
				metadata: 0,
	            nbt: Value::Null,
	            name: "stone".to_string(),
	            display_name: "Stone".to_string(),
	            stack_size: 64,
	            count: 6,
	            chest_x: 0,
	            chest_y: 0,
	            chest_z: 0,
	            slot: 0,

			},
		]).unwrap();

		let result = { vec![
			Item { 
				metadata: 0,
	            nbt: Value::Null,
	            name: "stone".to_string(),
	            display_name: "Stone".to_string(),
	            stack_size: 64,
	            count: 5,
	            chest_x: 0,
	            chest_y: 0,
	            chest_z: 0,
	            slot: 0,
			},
			Item { 
				metadata: 0,
	            nbt: Value::Null,
	            name: "stone".to_string(),
	            display_name: "Stone".to_string(),
	            stack_size: 64,
	            count: 1,
	            chest_x: 0,
	            chest_y: 0,
	            chest_z: 0,
	            slot: 1,

			},
		]};

		assert_eq!(result[0], items_to_get[0]);
		assert_eq!(result[1], items_to_get[1]);
	} 









}
