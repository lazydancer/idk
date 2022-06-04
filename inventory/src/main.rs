#[macro_use] extern crate rocket;


mod inventory;
mod player;
mod item;

use rocket::http::Header;
use rocket::{Request, Response};
use rocket::fairing::{Fairing, Info, Kind};


use crate::inventory::Inventory;
use crate::item::Item;


#[get("/")]
fn index() -> &'static str {
    "Hello Wolrd"
}

#[get("/api/myrocket")]
fn myrocket() -> String {
    "My 🚀 server".to_string()
}

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response
        }
    }

    async fn on_response<'r>(&self, _request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new("Access-Control-Allow-Methods", "POST, GET, PATCH, OPTIONS"));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}


#[launch]
fn rocket() -> _ {
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


    rocket::build().attach(CORS).mount("/", routes![index, myrocket])
}