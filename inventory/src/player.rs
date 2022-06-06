use std::io::{self, BufRead, Write};
use std::net::TcpStream;


use crate::item::{Item, json_to_items};


pub struct Player {
    // location: [i32; 3],
}


impl Player {

    pub fn new() -> Player {
        Player {}
    }

    pub fn open(&self, chest: &[i32; 3]) -> Vec<Item> {
        send_message(&Msg::Open(*chest));
        let response = send_message(&Msg::Log);
        send_message(&Msg::Close);
        json_to_items(&response)
    }

    pub fn move_position(&self, position: &[i32; 2]) {
        send_message(&Msg::Move(*position));
    }

    pub fn run(&self, commands: Vec<MoveItem>) {
        for cmd in commands {
            for msg in cmd.to_messages() {
                send_message(&msg);
            }
        }
    }


    pub fn test(&self) {
        send_message(&Msg::Move([187, 172]));
    }
}

#[derive(Debug)]
pub struct MoveItem {
    pub from_chest: [i32; 3],
    pub from_slot: i32,
    pub to_chest: [i32; 3],
    pub to_slot: i32,
    pub amount: i32,
}


impl MoveItem {
    fn to_messages(&self) -> Vec<Msg> {
        vec![
            Msg::Open(self.from_chest),
            Msg::LClick(self.from_slot),
            Msg::LClick(54),
            Msg::Close,
            Msg::Open(self.to_chest),
            Msg::LClick(54),
            Msg::LClick(self.to_slot),
            Msg::Close,
        ]
    }
 }


enum Msg {
    Open([i32; 3]),
    Close,
    LClick(i32),
    Move([i32; 2]),
    Log,
}

fn send_message(msg: &Msg) -> String {
    let mut stream = TcpStream::connect("127.0.0.1:1337").unwrap();


    let message = match msg {
        Msg::Open(chest) => format!("open {} {} {}", chest[0], chest[1], chest[2]),     
        Msg::Log => "log".to_string(),
        Msg::LClick(slot) => format!("lclick {}", slot),
        Msg::Move(location) => format!("move {} {}", location[0], location[1]),
        Msg::Close => "close".to_string(),
    };

    stream.write(message.as_bytes());

    const DEFAULT_BUF_SIZE: usize = 8 * 1024 * 8;
    let mut reader = io::BufReader::with_capacity(DEFAULT_BUF_SIZE, &mut stream);

    let received: Vec<u8>  = reader.fill_buf().unwrap().to_vec();

    reader.consume(received.len());

    String::from_utf8(received).unwrap()
}



// let items: Vec<Item> = 