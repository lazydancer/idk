use serde::{Deserialize, Serialize};
use serde_json::Value;


#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
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


impl Item  {
    pub fn new_without_location(metadata: i32, nbt: Value, name: String, display_name: String, count: i32) -> Item {
        Item {
            metadata,
            nbt,
            name,
            display_name,
            stack_size: 0,
            count,
            chest_x: 0,
            chest_y: 0,
            chest_z: 0,
            slot: 0,
        }
    }

    pub fn matches(&self, other: &Item) -> bool {
        self.metadata == other.metadata 
        &&  self.nbt == other.nbt
        &&  self.name == other.name
    }
}



pub fn json_to_items(json: &str) -> Vec<Item> {
    serde_json::from_str(json).unwrap()
}