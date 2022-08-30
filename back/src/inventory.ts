import { get_items, insert, apply_moves} from './db'
import * as actions from './actions'


export async function inventory() {
    const actual = await actions.take_inventory()
    const expected = await get_items();

    insert(actual);

}

export async function withdraw(items: any, station: number) {
    const inventory = await get_items();

    let moves = find(items, inventory, 1)

    console.log("to_withdraw")

    await actions.move(moves)

    await apply_moves(moves)
}

export async function deposit(station: number) {
    let items = await actions.get_chest_contents(station)

    const inventory = await get_items()
    
    const moves = find_spaces(items, inventory, station)

    console.log(moves)

    await actions.move(moves)

    await apply_moves(moves)

}



function find(items: any, inventory: any, station: number) {
    let result = [];
    
    let open_slot = 0

    let item: any
    for (item of items) {
        let count = item.count;

        let inv_item: any
        for (inv_item of inventory) {
            if ( !matches(item, inv_item) ){
                continue;
            }

            if ( count > inv_item.count ) {
                result.push({
                    "item": inv_item,
                    "from": { "chest_type": "inventory", "chest": inv_item.chest, "slot": inv_item.slot, },
                    "to": { "chest_type": "station", "chest": station, "slot": open_slot, },
                    "count": inv_item.count,
                })
                count -= inv_item.count
            } else {
                result.push({
                    "item": inv_item,
                    "from": { "chest_type": "inventory", "chest": inv_item.chest, "slot": inv_item.slot, },
                    "to": { "chest_type": "station", "chest": station, "slot": open_slot, },
                    "count": count,
                })
                count = 0
            }

            open_slot += 1

            if (count === 0) {
                break;
            }

        }

    }

    return result

}

function find_spaces(items: any, inventory: any, station: any) {
    let result = [];

    let open_slots_list = open_slots(inventory)


    let item, i: any
    for ([i, item] of items.entries()) {

        result.push({
            "item": item,
            "from": { "chest_type": "station", "chest": station, "slot": item.slot, },
            "to": { "chest_type": "inventory", "chest": open_slots_list[i].chest, "slot": open_slots_list[i].slot, },
            "count": item.count
        })        
    }

    return result

}

function open_slots(inventory: any) {
    const counts = global.player.get_counts()

    let result: any = []

    for(let i=0; i<counts["inventory"]; i++) {
        for(let j=0; j<54; j++) {
            if(!inventory.some((e: any) => (e.chest === i) && (e.slot === j))){
                result.push({
                    "chest": i,
                    "slot": j,
                })
            }
        }
    }

    return result;
}

function matches(item: any, other: any): boolean {
    return (item.name === other.name)  
    && (item.metadata === other.metadata)
    && (JSON.stringify(item.nbt) === JSON.stringify(other.nbt))
}

export async function testin() {
    await global.player.open("station", 2)
}