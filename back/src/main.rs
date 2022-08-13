#[macro_use] extern crate rocket;

use rocket::http::Header;
use rocket::{Request, Response, State};
use rocket::fairing::{Fairing, Info, Kind};
use rocket::tokio::task;

use std::{thread, time};

use crate::item::Item;
use crate::inventory::Inventory;


mod inventory;
mod item;
mod player;
mod commands;

mod tests;

struct Tx(flume::Sender<Vec<Item>>);
struct Rx(flume::Receiver<Vec<Item>>);


#[get("/api/list")]
async fn list() -> String {
    let list = inventory::Inventory::list().await.unwrap();
    let inventory_json = serde_json::to_string(&list).unwrap();

    inventory_json
}

#[post("/api/order", data="<input>")]
fn order(input: String, tx: &State<Tx>) {
    let v: Vec<Item> = serde_json::from_str(&input).unwrap();

    tx.0.try_send(v);
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


async fn our_async_program(rx: Rx) {
    // let inventory = Inventory::init().await.unwrap();
    loop {
        thread::sleep(time::Duration::from_millis(5000));
        match rx.0.try_recv() {
            Err(x) => println!("Rx try recv err {:?}!", x),
            Ok(x) => println!("Rx try recv err {:?}!", Inventory::init().await.unwrap().withdraw(x, [20, 83, 129]).await.unwrap()),
        }

    }

}

#[launch]
fn rocket() -> _ {

    let (tx, rx) = flume::unbounded();
    task::spawn(our_async_program(Rx(rx)));

    rocket::build()
        .manage(Tx(tx))
        .attach(CORS).mount("/", routes![list, order])
}

