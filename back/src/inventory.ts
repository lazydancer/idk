import { Player } from './player';
import { getItems } from './db'


async function withdraw(items: any) {
    const inventory = getItems();
    find(inventory, inventory)

}

function find(items: any, inventory: any) {
    let result = [];
    for (const item of items) {
        let count = item.count;

        for (const inv_item in inventory) {
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
       (item.name === other.name)  
    && (item.metadata === other.metadata)
    && (item.nbt === other.nbt)
}

async function deposit(chest: any) {
    
}