import { getItems, insert, remove} from './db'
import * as actions from './actions'
import { Pool } from 'pg';


export async function inventory() {
    let items = await actions.take_inventory()

    insert(items);

}

export async function withdraw(items: any, station: number) {
    const inventory = await getItems();

    let to_withdraw = find(items, inventory)

    await actions.withdraw(to_withdraw, 1);

    await remove(to_withdraw)

}

export async function deposit(station: number) {
    let items = await actions.get_chest_contents(station)

    const inventory = await getItems();

    const moves = find_spaces(items, inventory, station)

    await actions.move(moves);

}



function find(items: any, inventory: any) {
    let result = [];
    
    inventory.forEach((i: any) => {
        i['available'] = i['count']
    })

    let item: any
    for (item of items) {
        let count = item.count;

        let inv_item: any
        for (inv_item of inventory) {
            if ( !matches(item, inv_item) ){
                continue;
            }

            if ( count > inv_item.count ) {
                count -= inv_item.count
                result.push(inv_item)
            } else {
                inv_item.count = count
                result.push(inv_item)
                break;
            }
        }

    }

    return result

}

function find_spaces(items: any, inventory: any, station: any) {
    let result = [];

    let item, i: any
    for ([i, item] of items.entries()) {

        let open_slot: any = next_open_slot(inventory)

        result.push({
            "from": { "chest_type": "station", "chest": station, "slot": item.slot, },
            "to": { "chest_type": "inventory", "chest": open_slot[1], "slot": open_slot[2], },
            "count": item.count
        })


        inventory.push({
            'name': 'hold',
            'chest': open_slot[1],
            'slot': open_slot[2],
        })
        
    }

    return result

}

function next_open_slot(inventory: any) {
    let counts = global.player.get_counts()
    for(let i=0; i<counts["inventory"]; i++) {
        for(let j=0; j<54; j++) {
            if(!inventory.some((e: any) => (e.chest == i) && (e.slot == j))){
                return ["inventory", i, j]
            }
        }
    }
}

function matches(item: any, other: any): boolean {
    return (item.name === other.name)  
    && (item.metadata === other.metadata)
    && (item.nbt === other.nbt)
}
