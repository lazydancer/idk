#[macro_use] extern crate rocket;

use rocket::http::Header;
use rocket::{Request, Response, State};
use rocket::fairing::{Fairing, Info, Kind};
use rocket::tokio::task;

use std::{thread, time};

mod inventory;

struct Tx(flume::Sender<String>);
struct Rx(flume::Receiver<String>);


#[get("/api/list")]
async fn list() -> String {
    let inventory = inventory::inventory::Inventory::init().await;
    let inventory_json = serde_json::to_string(&inventory.unwrap()).unwrap();

    inventory_json
    // "[{
    //     \"key\": 0,
    //     \"name\": \"stone\",
    //     \"displayName\": \"Stone\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Natural\"
    // },
    // {
    //     \"key\": 1,
    //     \"name\": \"grass\",
    //     \"displayName\": \"Grass\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Natural\"
    // },
    // {
    //     \"key\": 2,
    //     \"name\": \"dirt\",
    //     \"displayName\": \"Dirt\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Mob Drops\"
    // },
    // {
    //     \"key\": 3,
    //     \"name\": \"wooden_pickaxe\",
    //     \"displayName\": \"Wooden Pickaxe\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Mob Drops\"
    // },
    // {
    //     \"key\": 4,
    //     \"name\": \"cobblestone\",
    //     \"displayName\": \"Cobblestone\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Mining\"
    // },
    // {
    //     \"key\": 5,
    //     \"name\": \"stone\",
    //     \"displayName\": \"Stone\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Natural\"
    // },
    // {
    //     \"key\": 6,
    //     \"name\": \"grass\",
    //     \"displayName\": \"Grass\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Natural\"
    // },
    // {
    //     \"key\": 7,
    //     \"name\": \"dirt\",
    //     \"displayName\": \"Dirt\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Mob Drops\"
    // },
    // {
    //     \"key\": 8,
    //     \"name\": \"wooden_pickaxe\",
    //     \"displayName\": \"Wooden Pickaxe\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Mob Drops\"
    // },
    // {
    //     \"key\": 9,
    //     \"name\": \"cobblestone\",
    //     \"displayName\": \"Cobblestone\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Mining\"
    // },
    // {
    //     \"key\": 10,
    //     \"name\": \"stone\",
    //     \"displayName\": \"Stone\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Natural\"
    // },
    // {
    //     \"key\": 11,
    //     \"name\": \"grass\",
    //     \"displayName\": \"Grass\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Natural\"
    // },
    // {
    //     \"key\": 12,
    //     \"name\": \"dirt\",
    //     \"displayName\": \"Dirt\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Mob Drops\"
    // },
    // {
    //     \"key\": 13,
    //     \"name\": \"wooden_pickaxe\",
    //     \"displayName\": \"Wooden Pickaxe\",
    //     \"metadata\": 0,
    //     \"nbt\": null,
    //     \"available\": 12,
    //     \"group\": \"Mob Drops\"
    // },
    // {
    //     \"key\": 14,
    //     \"name\": \"cobblestone\",
    //     \"displayName\": \"Cobblestone\",
    //     \"metadata\": 0,
    //     \"nbt\": {  \"key\": 14,
    //                 \"name\": \"cobblestone\",
    //                 \"displayName\": \"Cobblestone\",
    //                 \"metadata\": 0,
    //                 \"nbt\": null,
    //                 \"available\": 12,
    //                 \"group\": \"Mining\"
    //                 },
    //     \"available\": 12,
    //     \"group\": \"Mining\"
    // }
    // ]"
}


#[get("/api/order")]
fn order(tx: &State<Tx>) {
    tx.0.try_send("recieved".to_string());
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
    // let inventory = inventory::inventory::Inventory::init().await;
    // let inventory_json = serde_json::to_string(&inventory.unwrap()).unwrap();

    // println!("{:?}", inventory_json);

    loop {
        thread::sleep(time::Duration::from_millis(5000));
        println!("Rx try recv {:?}!", rx.0.try_recv());
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

