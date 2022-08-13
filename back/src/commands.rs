use crate::player::Msg;

#[derive(Debug, Clone, Copy)]
pub struct MoveItem {
    pub from_chest: [i32; 3],
    pub from_chest_pos: [i32; 2],
    pub from_slot: i32,
    pub from_amount: i32,
    pub to_chest: [i32; 3],
    pub to_chest_pos: [i32; 2],
    pub to_slot: i32,
    pub amount: i32,
}

pub fn group_moves(commands: Vec<MoveItem>) -> Vec<Msg> {

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


            if c.amount == c.from_amount {
                messages.push(Msg::LClick(open_slot as i32 + 54));
            } else {
                for _ in 0..c.amount as usize {
                    messages.push(Msg::RClick(open_slot as i32 + 54));
                }
                messages.push(Msg::LClick(c.from_slot));
            }



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