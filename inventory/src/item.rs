use serde::{Deserialize, Serialize};
use serde_json::Value;


#[derive(Serialize, Deserialize, Debug)]
pub struct Item {
    pub metadata: i32,
    pub nbt: Value,
    pub name: String,
    pub display_name: String,
    pub stack_size: i32,
    pub count: i32,
    pub chest_x: i32,
    pub chest_y: i32,
    pub chest_z: i32,
    pub slot: i32,
}

impl Item {
    pub fn base(name: String, metadata: i32, nbt: Value) -> Item {
        Item {
            name: String::from("stone"),
            metadata: 0,
            nbt: serde_json::Value::Null,
            display_name: String::from("Stone"),
            stack_size: 64,
            count: 64,
            chest_x: 0,
            chest_y: 0,
            chest_z: 0,
            slot: 0,
        }

    }
}

pub fn json_to_items(json: &str) -> Vec<Item> {
    serde_json::from_str(json).unwrap()
}


