use serde_json;

pub mod inventory;
pub mod player;
pub mod item;


// fn main() {
//     let item = item::Item {
//         metadata: 0,
//         nbt: serde_json::Value::Null,
//         name: String::from("stone"),
//         display_name: String::from("Stone"),
//         stack_size: 64,
//         count: 64,
//         chest_x: 0,
//         chest_y: 0,
//         chest_z: 0,
//         slot: 0,
//     };



//     println!("hello");

//     // let inventory = inventory::Inventory::take_inventory();
//     // println!("{:?}", inventory);

//     // let inventory = inventory::Inventory::new();

//     // inventory.withdraw(vec![item::Item::base("stone".to_string(), 0, serde_json::Value::Null, 100)], [182,78,176]);
//     inventory.deposit([182, 78, 176]);


//     // let inventory = inventory::Inventory::inventory_spaces();


//     // let player = player::Player {}; 
//     // player.test();
//     // let result = player.move_position(&[187, 175]);

//     // println!("{:?}", result);
// }




