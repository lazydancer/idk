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

function matches(item: any, other: any): boolean {
    return (item.name === other.name)  
    && (item.metadata === other.metadata)
    && (item.nbt === other.nbt)
}

async function deposit(station: number) {
    
}