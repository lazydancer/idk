import { get_items, insert, apply_moves} from './db'
import * as actions from './actions'
import * as types from './types'


export async function inventory() {
    const actual = await actions.take_inventory()
    const expected = await get_items();

    insert(actual);

}

export async function withdraw(items: {item: types.Item, count: number}[], station: number) {
    const inventory = await get_items();

    let moves = find(items, inventory, station)

    await actions.move_items(moves)

    await apply_moves(moves)
}

export async function deposit(station: number) {
    let items = await actions.get_chest_contents(station)

    let shulker_items = await learn_shulker_contents(items)
    items = items.concat(shulker_items)
    
    const inventory = await get_items()
    
    const moves = find_spaces(items, inventory, station)

    await actions.move_items(moves)

    await apply_moves(moves)

}

async function learn_shulker_contents(items: {item: types.Item, location: types.Location}[]): Promise<{item: types.Item, location: types.Location}[]> {
    let shulkers = []

    
    for (const box of items.filter( x => x.item.name.endsWith("shulker_box"))) {

        let shulker_contents = await actions.get_shukler_contents(box.location.chest, box.location.slot)

        shulker_contents.forEach((x: {item: types.Item, location: types.Location}) => {
            x.location.slot = box.location.slot;
            x.location.chest = box.location.chest;
        })

        shulkers.push(shulker_contents)
    }

    return shulkers.flat()
}

function find(items: {item: types.Item, count: number}[], inventory: {item: types.Item, location: types.Location, count: number}[], station: number): {item: types.Item, from: types.Location, to: types.Location, count: number}[] {
    let result = [];
    
    let open_slot = 0

    for (let item of items) {
        let count = item.count;

        for (let inv_item of inventory) {
            if ( !matches(item.item, inv_item.item) ){
                continue;
            }

            result.push({
                "item": inv_item.item,
                "from": inv_item.location,
                "to": { "chest_type": types.ChestType.Station, "chest": station, "slot": open_slot, "shulker_slot": null},
                "count": inv_item.count,
            })

            count -= inv_item.count

            if (count === 0) {
                break;
            }

            open_slot += 1


        }

    }

    return result

}

function find_spaces(items: {item: types.Item, location: types.Location, count: number}[], inventory: {item: types.Item, location: types.Location, count: number}[], station: number) {
    let result = [];

    let open_slots_list = open_slots(inventory)

    for (let [i, item] of items.filter(x => x.location.shulker_slot == null).entries()) {

        result.push({
            "item": item.item,
            "from": item.location,
            "to": open_slots_list[i],
            "count": item.count
        })
        
        // Find and move shulker items
        for(let shulker_item of items.filter(x => ( x.location.shulker_slot != null ) && ( x.location.slot == item.location.slot ))) {
            result.push({
                "item": shulker_item.item,
                "from": shulker_item.location,
                "to": { ...open_slots_list[i], "shulker_slot": shulker_item.location.shulker_slot },
                "count": shulker_item.count
            })

        }
    }

    return result

}

function open_slots(inventory: {item: types.Item, location: types.Location, count: number}[]): types.Location[] {
    const counts = actions.get_counts()

    let result: any = []

    for(let chest=0; chest<counts["inventory"]; chest++) {
        for(let slot=0; slot<54; slot++) {
            if(!inventory.some(item => (item.location.chest === chest) && (item.location.slot === slot))){
                result.push({
                    "chest_type": types.ChestType.Inventory,
                    chest,
                    slot,
                    "shulker_slot": null,
                })
            }
        }
    }

    return result;
}

function matches(item: types.Item, other: types.Item): boolean {
    return (item.name === other.name)  
    && (item.metadata === other.metadata)
    && (JSON.stringify(item.nbt) === JSON.stringify(other.nbt))
}
