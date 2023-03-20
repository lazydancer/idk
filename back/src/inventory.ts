import { get_items, insert, apply_moves} from './db'
import * as actions from './actions'
import * as types from './types'


export async function inventory() {
    const actual = await actions.take_inventory()
    const expected = await get_items();

    // need to compare actual versus expected
    // writing directly tot he database for now
    insert(actual);

}

export async function withdraw(items: {item: types.Item, count: number}[], station: number) {
    const inventory = await get_items();

    let moves = find(items, inventory, station)

    await actions.move_items(moves)

    await apply_moves(moves)
}

export async function deposit(station: number) {
    station = 0 // override station number for testing

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
    let move_items: {item: types.Item, from: types.Location, to: types.Location, count: number}[] = [];
    
    let open_slot = 0

    for (let item of items) {

        let count = item.count;

        // Handle full shuklers
        let shulker_count = Math.floor(count / ( 27 * item.item.stack_size ) )
        let full_shulkers = _find_full_shulkers(inventory).filter( x => matches(x.inner_item, item.item) )

        while(shulker_count > 0 && full_shulkers.length > 0) {
            let shulker = full_shulkers.pop()!

            move_items.push({
                "item": shulker.item,
                "from": shulker.location,
                "to": { "chest_type": types.ChestType.Station, "chest": station, "slot": open_slot, "shulker_slot": null},
                "count": 1,
            })

            // move shulker contents to station chest
            let shulker_contents = _find_shulker_contents(inventory, shulker.location)
            shulker_contents.forEach( shulker_item => {
                move_items.push({
                    "item": shulker_item.item,
                    "from": shulker_item.location,
                    "to": { "chest_type": types.ChestType.Station, "chest": station, "slot": open_slot, "shulker_slot": shulker_item.location.shulker_slot},
                    "count": shulker_item.count,
                })
            })

            shulker_count -= 1
            count -= 27 * item.item.stack_size
            open_slot += 1

            // remove item from inventory
            inventory = inventory.filter( x => x.location.chest !== shulker.location.chest && x.location.slot !== shulker.location.slot )
        
        }

        if (count === 0) {
            continue;
        }

        let item_inventory = inventory.filter( inv_item => matches(item.item, inv_item.item) )

        // Sort where shulker slots are null first
        item_inventory.sort( (a, b) => {
            if (a.location.shulker_slot === null && b.location.shulker_slot !== null) {
                return -1
            } else if (a.location.shulker_slot !== null && b.location.shulker_slot === null) {
                return 1
            } else {
                return 0
            }
        })

        // Loop through until we have enough
        for( let inv_item of item_inventory) {
            // If we have more than we need, just take what we need
            if (inv_item.count > count) {
                move_items.push({
                    "item": inv_item.item,
                    "from": inv_item.location,
                    "to": { "chest_type": types.ChestType.Station, "chest": station, "slot": open_slot, "shulker_slot": null},
                    "count": count,
                })

                open_slot += 1
                break;
            }

            move_items.push({
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

    return move_items

}


function find_spaces(items_to_move: {item: types.Item, location: types.Location, count: number}[], inventory: {item: types.Item, location: types.Location, count: number}[], station: number) {
    let result: any = [];

    let open_slots_list = get_open_slots(inventory)

    items_to_move
        .filter(item => item.location.shulker_slot == null)
        .forEach((item, i) => {
            result.push({
                "item": item.item,
                "from": item.location,
                "to": open_slots_list[i],
                "count": item.count
            })
    
            // Find and move any items stored in a container within the same slot
            items_to_move
                .filter(shulker_item => shulker_item.location.shulker_slot != null && shulker_item.location.slot == item.location.slot)
                .forEach(shulker_item => {
                    result.push({
                        "item": shulker_item.item,
                        "from": shulker_item.location,
                        "to": { ...open_slots_list[i], "shulker_slot": shulker_item.location.shulker_slot },
                        "count": shulker_item.count
                    })
                })
        })

    return result

}

function get_open_slots(inventory: {item: types.Item, location: types.Location, count: number}[]): types.Location[] {
    const counts = actions.get_counts()

    let result: any = []

    for(let chest_index = 0; chest_index < counts.inventory; chest_index++) {
        for(let slot_index = 0; slot_index < 54; slot_index++) {
            const is_occupied = inventory.some(item => (item.location.chest === chest_index) && (item.location.slot === slot_index))

            if(!is_occupied) {
                result.push({
                    chest_type: types.ChestType.Inventory,
                    chest: chest_index,
                    slot: slot_index,
                    shulker_slot: null,
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

function _find_full_shulkers(inventory: {item: types.Item, location: types.Location, count: number}[]): {item: types.Item, location: types.Location, inner_item: types.Item}[] {
    const fullShulkers = [];
    for (const {item, location, count} of inventory) {
      if (item.name.endsWith("shulker_box")) {

        // Find all the subslots in this chest and slot
        const subslots = _find_shulker_contents(inventory, location)

        // Check if there are exactly 4 subslots with a count of 64
        if (
          subslots.length === 27 &&
          subslots.every(({count}) => count === subslots[0].item.stack_size) && 
          subslots.every(({item}) => matches(item, subslots[0].item))
        ) {
          fullShulkers.push({
            location: location,
            item: item,
            inner_item: subslots[0].item,
          })
        }
      }
    }
    return fullShulkers;
}

function _find_shulker_contents(inventory: {item: types.Item, location: types.Location, count: number}[], shulker_location: types.Location): {item: types.Item, location: types.Location, count: number}[] {
    return inventory.filter(({location}) => 
        location.chest === shulker_location.chest && 
        location.slot == shulker_location.slot &&
        location.shulker_slot != null
    )
}