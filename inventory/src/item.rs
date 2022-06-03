use serde::{Deserialize, Serialize};
use serde_json::Value;


#[derive(Serialize, Deserialize, Debug)]
pub struct Item {
    pub code: i32,
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

pub fn json_to_items(json: &str) -> Vec<Item> {
    serde_json::from_str(json).unwrap()
}


