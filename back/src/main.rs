#[macro_use] extern crate rocket;

use rocket::http::Header;
use rocket::{Request, Response};
use rocket::fairing::{Fairing, Info, Kind};


#[get("/api/list")]
fn list() -> &'static str {
    "[{
        \"key\": 0,
        \"name\": \"stone\",
        \"displayName\": \"Stone\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Natural\"
    },
    {
        \"key\": 1,
        \"name\": \"grass\",
        \"displayName\": \"Grass\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Natural\"
    },
    {
        \"key\": 2,
        \"name\": \"dirt\",
        \"displayName\": \"Dirt\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Mob Drops\"
    },
    {
        \"key\": 3,
        \"name\": \"wooden_pickaxe\",
        \"displayName\": \"Wooden Pickaxe\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Mob Drops\"
    },
    {
        \"key\": 4,
        \"name\": \"cobblestone\",
        \"displayName\": \"Cobblestone\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Mining\"
    },
    {
        \"key\": 5,
        \"name\": \"stone\",
        \"displayName\": \"Stone\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Natural\"
    },
    {
        \"key\": 6,
        \"name\": \"grass\",
        \"displayName\": \"Grass\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Natural\"
    },
    {
        \"key\": 7,
        \"name\": \"dirt\",
        \"displayName\": \"Dirt\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Mob Drops\"
    },
    {
        \"key\": 8,
        \"name\": \"wooden_pickaxe\",
        \"displayName\": \"Wooden Pickaxe\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Mob Drops\"
    },
    {
        \"key\": 9,
        \"name\": \"cobblestone\",
        \"displayName\": \"Cobblestone\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Mining\"
    },
    {
        \"key\": 10,
        \"name\": \"stone\",
        \"displayName\": \"Stone\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Natural\"
    },
    {
        \"key\": 11,
        \"name\": \"grass\",
        \"displayName\": \"Grass\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Natural\"
    },
    {
        \"key\": 12,
        \"name\": \"dirt\",
        \"displayName\": \"Dirt\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Mob Drops\"
    },
    {
        \"key\": 13,
        \"name\": \"wooden_pickaxe\",
        \"displayName\": \"Wooden Pickaxe\",
        \"metadata\": 0,
        \"nbt\": null,
        \"available\": 12,
        \"group\": \"Mob Drops\"
    },
    {
        \"key\": 14,
        \"name\": \"cobblestone\",
        \"displayName\": \"Cobblestone\",
        \"metadata\": 0,
        \"nbt\": {  \"key\": 14,
                    \"name\": \"cobblestone\",
                    \"displayName\": \"Cobblestone\",
                    \"metadata\": 0,
                    \"nbt\": null,
                    \"available\": 12,
                    \"group\": \"Mining\"
                    },
        \"available\": 12,
        \"group\": \"Mining\"
    }






    ]"
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
    rocket::build().attach(CORS).mount("/", routes![list])
}