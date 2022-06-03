#![feature(proc_macro_hygiene, decl_macro)]

use rocket::http::RawStr;

#[macro_use] extern crate rocket;

use rocket::http::Header;
use rocket::{Request, Response};
use rocket::fairing::{Fairing, Info, Kind};

#[get("/")]
fn index() -> &'static str {
    "Hello Wolrd"
}

#[get("/api/myrocket")]
fn myrocket() -> String {
    "My 🚀 server".to_string()
}

pub struct CORS;

impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response
        }
    }

    fn on_response(&self, request: &Request, response: &mut Response) {
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new("Access-Control-Allow-Methods", "POST, GET, PATCH, OPTIONS"));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}


fn main() {
    rocket::ignite().attach(CORS).mount("/", routes![index, myrocket]).launch();
}