import * as db from '../model/db'
import * as types from '../types/types'
import * as helper from './helper'
import * as item_helper from './item'

/*
    Inventory is responsible for managing the inventory by tracking the
    locations of items within it. It provides functions for withdrawing and
    depositing items.
*/

import { load_config } from '../types/config'
const config = load_config()

const INVENTORY_SIZE = config.build.depth * config.build.width * 6

export async function list(): Promise<{item: types.Item, count: number}[]> {
    const inventory = await get_inventory()
    return summarize(inventory)
}

export async function item(item_id: number): Promise<{item: types.Item, count: number, history: any }> {
    const inventory = await get_inventory()
    const item_info = inventory.find( (x:any) => x.item.id == item_id)
    return await item_helper.summarize(item_info)
}


export async function withdraw(items: {item: types.Item, count: number}[], station: number) {
    const inventory = await get_inventory();

    let selectedItems = select_items_to_withdraw(items, inventory)
    let moves = select_spaces_to_withdraw_items(selectedItems, station)
    const id = db.add_job(types.JobType.Move, moves)

    return id
}

// Deposit is a two step process. Learn about the station's contents, then deposit the items.
// Worker calls deposit function with verified = true
export async function quote(station: number, verified: boolean): Promise<number> {
    const chest = {chest_type: types.ChestType.Station, chest: station, deposit: verified}
    const id = db.add_job(types.JobType.Survey, chest)

    return id
}

export async function deposit(items: types.ItemLocation[]): Promise<number> { 
    await db.get_item_ids(items.map((i: any) => i.item))

    const inventory = await get_inventory()
    const moves = select_spaces_to_place_items(items, inventory)

    const id = db.add_job(types.JobType.Move, moves)

    return id
}

export async function get_survey(job_id: number): Promise<{item: types.Item, count: number}[]> {
    const inventory = await db.get_survey(job_id)
    return summarize(inventory)
}



async function get_inventory(): Promise<types.ItemLocation[]> {
    // Get the future inventory state

    const inventory = await db.get_items()
    let queue = await db.get_queue()

    queue = queue.filter( x => x.status === types.JobStatus.Queued || x.status === types.JobStatus.InProgress)

    for (const job of queue) {
        switch (job.type) {
            case types.JobType.Move:
                const moves = job.parameters;
                apply_moves(types.ChestType.Inventory, inventory, moves)
                break;
        }
    }
    
    return inventory
}



function summarize(inventory: types.ItemLocation[]): {item: types.Item, count: number}[] {
    return inventory.filter(x => !x.item.name.endsWith("shulker_box")).reduce((acc: any, x) => {
        const existing = acc.find((y:any) => y.item.id === x.item.id);
        if (existing) {
          existing.count += x.count;
        } else {
          acc.push({
            item: {
              id: x.item.id,
              name: x.item.name,
              metadata: x.item.metadata,
              nbt: x.item.nbt,
              display_name: x.item.display_name,
              stack_size: x.item.stack_size,
            },
            count: x.count,
          });
        }
        return acc;
      }, []);
}

function select_items_to_withdraw(items: {item: types.Item, count: number}[], inventory: types.ItemLocation[]): types.ItemLocation[] {
    let selectedItems: types.ItemLocation[] = [];
    
    let open_slot = 0

    for (const { item, count } of items) {
        let remainingCount = count
        
        // First if there are any shulkers with the item, take those
        let shulker_count = Math.floor(count / ( 27 * item.stack_size ) )
        let fullShulkers = helper.get_full_shulkers(inventory).filter( x => x.inner_item.id === item.id)

        for (const shulker of fullShulkers) {
            if (remainingCount < 27 * item.stack_size) break;

            selectedItems.push({"item": shulker.item, "location": shulker.location, "count": 1,})

            // move shulker contents to with it's shulker above to station chest
            helper.find_shulker_contents(inventory, shulker.location).forEach( shulker_item => {
                selectedItems.push({
                    "item": shulker_item.item,
                    "location": shulker_item.location,
                    "count": shulker_item.count,
                })
            })

            remainingCount -= 27 * item.stack_size           

            // remove item from inventory to not accidentally select it again
            inventory = inventory.filter( x => x.location.chest !== shulker.location.chest && x.location.slot !== shulker.location.slot )
        }

        // Second from the inventory, prefer not in a shulker box
        // Sort where shulker slots are null first
        let matchingItems = inventory.filter( inv_item => item.id === inv_item.item.id )
                                     .sort( (a, b) => {
                                        if (a.location.shulker_slot === null && b.location.shulker_slot !== null) {
                                            return -1
                                        } else if (a.location.shulker_slot !== null && b.location.shulker_slot === null) {
                                            return 1
                                        } else {
                                            return 0
                                        }
                                     })

        // Loop through until we have enough
        for( let matchingItem of matchingItems) {
            if (remainingCount === 0) {
                break;
            }

            // If we have more than we need, just take what we need
            if (matchingItem.count > remainingCount) {
                selectedItems.push({
                    "item": matchingItem.item,
                    "location": matchingItem.location,
                    "count": remainingCount,
                })

                open_slot += 1
                break;
            }

            selectedItems.push({
                "item": matchingItem.item,
                "location": matchingItem.location,
                "count": matchingItem.count,
            })

            remainingCount -= matchingItem.count

        }
    }

    console.log(selectedItems)

    return selectedItems

}

function select_spaces_to_withdraw_items(items_to_move: types.ItemLocation[], station: number): types.MoveItem[] {
    let result: types.MoveItem[] = []

    let moved: types.ItemLocation[] = []

    // move items not in shulker boxes first and items moving with shulker boxes first
    items_to_move
        .filter(item => item.location.shulker_slot == null)
        .forEach((item) => {
            result.push({
                "item": item.item,
                "from": item.location,
                "to": { chest_type: types.ChestType.Station, chest: station, slot: globalThis.openSlot, shulker_slot: null },
                "count": item.count
            })

            moved.push(item)

            // Find and move any items stored in a container within the same slot
            items_to_move
                .filter(shulker_item => shulker_item.location.shulker_slot != null && shulker_item.location.slot === item.location.slot)
                .forEach(shulker_item => {
                    result.push({
                        "item": shulker_item.item,
                        "from": shulker_item.location,
                        "to": { chest_type: types.ChestType.Station, chest: station, slot: globalThis.openSlot, "shulker_slot": shulker_item.location.shulker_slot },
                        "count": shulker_item.count
                    })
                    moved.push(shulker_item)
                })
                
            
            if (globalThis.openSlot >= 53) {
                globalThis.openSlot = 0
            } else {
                globalThis.openSlot += 1
            }
        })

    // move items from within shulker boxes
    items_to_move = items_to_move.filter(item => !moved.includes(item))
    items_to_move.forEach((item) => {
        result.push({
            "item": item.item,
            "from": item.location,
            "to": { chest_type: types.ChestType.Station, chest: station, slot: globalThis.openSlot, shulker_slot: null },
            "count": item.count
        })
        moved.push(item)
    
        if (globalThis.openSlot >= 53) {
            globalThis.openSlot = 0
        } else {
            globalThis.openSlot += 1
        }
    })

    items_to_move = items_to_move.filter(item => !moved.includes(item))

    if (items_to_move.length > 0) {
        console.log("ERROR: Some items were not moved")
        console.log(items_to_move)
    }

    return result

}


function select_spaces_to_place_items(items_to_move: types.ItemLocation[], inventory: types.ItemLocation[]): types.MoveItem[] {
    let result: any = [];

    let open_slots_list = get_open_slots(inventory, INVENTORY_SIZE)

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

function get_open_slots(inventory: types.ItemLocation[], chest_count: number): types.Location[] {
    let result: any = []

    for(let chest_index = 0; chest_index < chest_count; chest_index++) {
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



export function apply_moves(chest_type: types.ChestType, inventory: types.ItemLocation[], moves: types.MoveItem[]) {
    // Implicit returns inventory variable with inventory state after applying the moves
    // This must match db.apply_moves()

    for (const move of moves) {

        const fromLocationIndex = inventory.findIndex(
            (loc) =>
              loc.location.chest_type === move.from.chest_type &&
              loc.location.chest === move.from.chest &&
              loc.location.slot === move.from.slot &&
              loc.location.shulker_slot === move.from.shulker_slot
        );
        

        if (fromLocationIndex !== -1) {
            inventory[fromLocationIndex].count -= move.count;
            if (inventory[fromLocationIndex].count <= 0) {
              inventory.splice(fromLocationIndex, 1);
            }
        }

        const toLocationIndex = inventory.findIndex(
            (loc) =>
              loc.location.chest_type === move.to.chest_type &&
              loc.location.chest === move.to.chest &&
              loc.location.slot === move.to.slot &&
              loc.location.shulker_slot === move.to.shulker_slot
          );
        
        if (toLocationIndex !== -1) {
            inventory[toLocationIndex].count += move.count;
        } else if (move.to.chest_type === chest_type) {
            inventory.push({
                item: move.item,
                location: move.to,
                count: move.count,
            });
        }

    }

}