use std::io::{self, BufRead, Write};
use std::net::TcpStream;


use crate::inventory;
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
        let msgs = group_moves(commands);
        println!("result: {:?}", &msgs);

        for m in msgs {
            send_message(&m);
        }
    }


    pub fn test(&self) {
        send_message(&Msg::Move([187, 172]));
    }
}

#[derive(Debug, Clone, Copy)]
pub struct MoveItem {
    pub from_chest: [i32; 3],
    pub from_chest_pos: [i32; 2],
    pub from_slot: i32,
    pub to_chest: [i32; 3],
    pub to_chest_pos: [i32; 2],
    pub to_slot: i32,
    pub amount: i32,
}


impl MoveItem {
    fn to_messages(&self) -> Vec<Msg> {
        vec![
            Msg::Move(self.from_chest_pos),
            Msg::Open(self.from_chest),
            Msg::LClick(self.from_slot),
            Msg::LClick(54),
            Msg::Close,
            Msg::Move(self.to_chest_pos),
            Msg::Open(self.to_chest),
            Msg::LClick(54),
            Msg::LClick(self.to_slot),
            Msg::Close,
        ]
    }
 }


fn group_moves(commands: Vec<MoveItem>) -> Vec<Msg> {

    // Group common from chests together as much as possible
    // commands.sort(from_chest);
    let mut messages = vec![];

    let first_empty = |arr: &[Option<_>]| arr.iter().position(|x| x.is_none());


    for chunk in commands.chunks(27) {

        let mut inventory: [Option<MoveItem>; 27] = Default::default();
        let mut prev_chest: Option<[i32; 3]> = None;

        for c in chunk {

            if Some(c.from_chest) != prev_chest {
                if prev_chest != None {
                    messages.push(Msg::Close);
                }

                messages.push(Msg::Move(c.from_chest_pos));
                messages.push(Msg::Open(c.from_chest));
            
                prev_chest = Some(c.from_chest);
            }



            messages.push(Msg::LClick(c.from_slot));
            let open_slot = first_empty(&inventory).unwrap();
            inventory[open_slot] = Some(*c);
            messages.push(Msg::LClick(open_slot as i32+ 54));
        } 

        messages.push(Msg::Close);

        
        prev_chest = None;

        for (i,inv) in inventory.iter().enumerate() {

            if let Some(inv) = inv {
                if Some(inv.to_chest) != prev_chest {
                    if prev_chest != None {
                        messages.push(Msg::Close);
                    }
                    
                    messages.push(Msg::Move(inv.to_chest_pos));
                    messages.push(Msg::Open(inv.to_chest));

                    prev_chest = Some(inv.to_chest);
                }

                messages.push(Msg::LClick(i as i32 + 54));
                messages.push(Msg::LClick(inv.to_slot));

            }
           
        }

        messages.push(Msg::Close);

    }


    messages

}


#[derive(Debug)]
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