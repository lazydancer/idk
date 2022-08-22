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

    const items_w_moves = find_spaces(items, inventory)

    // await actions.deposit(items_w_moves);

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

function find_spaces(items: any, inventory: any) {
    let result = [];

    let item, i: any
    for ([i, item] of items.entries()) {
        let inv_item: any
        for (inv_item of inventory) {
            
            if ( !matches(item, inv_item) ){
                continue;
            }
            if (inv_item.count == inv_item.stack_size){
                continue;
            }

            let space_in_stack = inv_item.stack_size - inv_item.count
            
            if (space_in_stack >= item.count) {
                item['to'] = ["inventory", inv_item.chest, inv_item.slot]
                
                inv_item.count += (item.count - space_in_stack)

                result.push(item)
                break;
            }

        }

        if(! ("to" in item)) {
            item['to'] = next_open_slot(inventory)

            inventory.push({
                'name': 'hold',
                'chest': item['to'][1],
                'slot': item['to'][2],
            })

            result.push(item)
        }        
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
