#![feature(proc_macro_hygiene, decl_macro)]
#[macro_use] extern crate rocket;


mod inventory;
mod player;
mod item;
mod back;


use crate::inventory::Inventory;
use crate::item::Item;

fn main() {

    back::rocket();
    // let inventory = Inventory::new();
    // inventory.test();

    // inventory.deposit([9, 83, 151]);

    // println!("{:?}", inventory.items);
    // let commands = vec![MoveItem {
    //     from_chest: [9, 83, 151],
    //     from_slot: 0,
    //     to_chest: [9, 84, 153],
    //     to_slot: 0,
    //     amount: 64,
    // }];

    // let player = Player::new();
    // player.run(commands);

    // println!("{:?}", inventory);
}

