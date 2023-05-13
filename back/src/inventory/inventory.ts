import * as db from '../model/db'
import * as types from '../types/types'
import * as helper from './helper'
import * as item_helper from './item'

import { load_config } from '../types/config'
const config = load_config()

/*
    Inventory is responsible for managing the inventory by tracking the
    locations of items within it. It provides functions for adding location data for 
    withdrawing and depositing items (ItemCounts -> ItemLocations) and overviews of the inventory
*/


export async function withdraw(items: types.ItemCount[], station: number): Promise<types.MoveItem[]> {
    const inventory = await db.get_items()

    let selectedItems = get_item_locations(items, inventory)

    const moves = selectedItems.map((item: types.ItemLocation) => {
        return {
            item: item.item,
            from: item.location,
            to: {chest_type: types.ChestType.Station, chest: station, slot: 0, shulker_slot: null},
            count: item.count,
        }
    })
    return moves
}

export async function deposit(items: types.ItemLocation[]): Promise<types.MoveItem[]> { 
    const inventory = await db.get_items()
    const moves = get_space_locations(items, inventory)

    return moves
}


export async function list(): Promise<{item: types.Item, count: number}[]> {
    const inventory = await db.get_items()
    return summarize(inventory)
}

export async function item(item_id: number): Promise<{item: types.Item, count: number, history: any }> {
    const inventory = await db.get_items()
    const item_info = inventory.filter( (x:any) => x.item.id == item_id)
    return await item_helper.summarize(item_info)
}




export async function get_survey(job_id: number): Promise<types.ItemCount[]> {
    const inventory = await db.get_survey(job_id)
    return summarize(inventory)
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

function get_item_locations(items: {item: types.Item, count: number}[], inventory: types.ItemLocation[]): types.ItemLocation[] {

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



const INVENTORY_SIZE = config.build.depth * config.build.width * 6

function get_space_locations(items_to_move: types.ItemLocation[], inventory: types.ItemLocation[]): types.MoveItem[] {
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

