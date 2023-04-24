import { get_items, apply_moves, get_item_ids, get_summary} from './db'
import * as actions from './actions'
import * as types from './types'


export async function inventory() {
    const counts = await actions.get_counts()

    let actual = []
    // for (let i = 0; i < counts["inventory"]; i++) {
    for (let i = 0; i < 72; i++) {
        console.log("inventory", i)

        let r = await actions.get_chest_contents(types.ChestType.Inventory, i)
        get_item_ids(r.map((i: any) => i.item))

        actual.push(r)
    }
    actual = actual.flat()

    // const expected = await get_items();

    // Temporary to fill database
    // convert actual to moves to apply to database
    let moves = []
    for (let actualItem of actual) {
        moves.push({item: actualItem.item, to: actualItem.location, from: {chest_type: types.ChestType.Station, chest: 0, slot: 0, shulker_slot: null}, count: actualItem.count})
    }
    // don't move_items just apply the move to the database
    await apply_moves(moves)


}

export async function list(): Promise<{item: types.Item, count: number}[]> {
    const items = await get_summary()
    return items
}

export async function withdraw(items: {item: types.Item, count: number}[], station: number) {
    const inventory = await get_items();

    let moves = _select_items_to_withdraw(items, inventory, station)

    await actions.move_items(moves)

    await apply_moves(moves)
}


export async function deposit(station: number) {
    let items = await actions.get_chest_contents(types.ChestType.Station, station)

    await get_item_ids(items.map((i: any) => i.item))

    const inventory = await get_items()
    const moves = _select_spaces_to_place_items(items, inventory, station)

    await actions.move_items(moves)
    await apply_moves(moves)

}


export async function quote(station: number): Promise<{item: types.Item, count: number}[]> {
    let items = await actions.get_chest_contents(types.ChestType.Station, station)

    await get_item_ids(items.map((i: any) => i.item))

    return items.map( (x: any) => {return {item: x.item, count: x.count}})
}

function _select_items_to_withdraw(items: {item: types.Item, count: number}[], inventory: types.ItemLocation[], station: number): {item: types.Item, from: types.Location, to: types.Location, count: number}[] {
    let move_items: {item: types.Item, from: types.Location, to: types.Location, count: number}[] = [];
    
    let open_slot = 0

    for (let item of items) {

        let count = item.count;

        // Handle full shuklers
        let shulker_count = Math.floor(count / ( 27 * item.item.stack_size ) )
        let full_shulkers = _find_full_shulkers(inventory).filter( x => x.inner_item.id === item.item.id)

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

        let item_inventory = inventory.filter( inv_item => item.item.id === inv_item.item.id )


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


function _select_spaces_to_place_items(items_to_move: types.ItemLocation[], inventory: types.ItemLocation[], station: number) {
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
                .filter(shulker_item => shulker_item.location.shulker_slot != null && shulker_item.location.slot === item.location.slot)
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

function get_open_slots(inventory: types.ItemLocation[]): types.Location[] {
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

function _score(inventory: types.ItemLocation[]): number {
    /*
    Gives a score to the current inventory state. The higher the score, the better the inventory state.
    
    Shulker utilization: You want to prioritize shulkers that are full with one type of item, as this maximizes the use of each shulker and reduces the overall number of shulkers needed.
    Slot utilization: You want to minimize the overall number of slots needed, as this reduces the physical space required for the storage system.
    Retrieval time: You want to balance the above factors with the time it takes to retrieve an item from a shulker. Retrieving an item from a shulker that is full with one type of item may be faster than retrieving an item from a shulker with a mix of items.    
    */

    const shulker_utilization_weight = 1
    const slot_utilization_weight = 1
    const retrieval_time_weight = 1

    // Shulker utilization
    const shulker_count = inventory.filter(item => item.item.name.endsWith("shulker_box")).length
    const full_shulker_count = _find_full_shulkers(inventory).length
    const shulker_utilization = full_shulker_count / shulker_count

    // Slot utilization
    const slots_count = inventory.filter(item => item.location.shulker_slot === null).length
    const items_count = inventory.length
    const slot_utilization = items_count / slots_count

    // Retrieval time
    // For each shulker, determine the number of unique items in it
    const unique_items = inventory.filter(item => item.item.name.endsWith("shulker_box")).map(shulker => {
        const subslots = _find_shulker_contents(inventory, shulker.location)
        // return the number of unique items in this shulker
        return subslots.map(subslot => subslot.item.id).filter((value, index, self) => self.indexOf(value) === index).length

    })
    const average_unique_items = unique_items.reduce((a, b) => a + b, 0) / unique_items.length

    return shulker_utilization_weight * shulker_utilization + slot_utilization_weight * slot_utilization - retrieval_time_weight * average_unique_items
}

function _find_full_shulkers(inventory: types.ItemLocation[]): {item: types.Item, location: types.Location, inner_item: types.Item}[] {
    const fullShulkers = [];
    for (const {item, location, count} of inventory) {
      if (item.name.endsWith("shulker_box")) {

        // Find all the subslots in this chest and slot
        const subslots = _find_shulker_contents(inventory, location)

        // Check if there are exactly 4 subslots with a count of 64
        if (
          subslots.length === 27 &&
          subslots.every(({count}) => count === subslots[0].item.stack_size) && 
          subslots.every(({item}) => item.id === subslots[0].item.id)
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

function _find_shulker_contents(inventory: types.ItemLocation[], shulker_location: types.Location): types.ItemLocation[] {
    return inventory.filter(({location}) => 
        location.chest === shulker_location.chest && 
        location.slot == shulker_location.slot &&
        location.shulker_slot != null
    )
}