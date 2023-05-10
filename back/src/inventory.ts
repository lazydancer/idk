import * as db from './db'
import * as types from './types'

/*
    Inventory is responsible for managing the inventory by tracking the
    locations of items within it. It provides functions for withdrawing and
    depositing items.

    When withdrawing items, there is only one path to follow. However, when
    depositing items, there are two paths to choose from.

    The first path involves depositing items to a station with just a station number.
    In this case, the worker calls the "move" function if the deposit flag is set to
    true.

    The second path involves depositing items after first obtaining a quote for the
    items in the station. If the deposit flag is set to false, the program will wait
    for user confirmation before proceeding. Once confirmation is received, the
    program will call the first method with the deposit flag set to true.
*/

import { loadConfig } from './config'
const config = loadConfig()

const INVENTORY_SIZE = config.build.depth * config.build.width * 6

export async function list(): Promise<{item: types.Item, count: number}[]> {
    const inventory = await get_inventory()
    return summarize(inventory)
}

export async function withdraw(items: {item: types.Item, count: number}[], station: number) {
    const inventory = await get_inventory();

    let selectedItems = select_items_to_withdraw(items, inventory)
    let moves = select_spaces_to_withdraw_items(selectedItems, station)
    const id = db.add_job(types.JobType.Move, moves)

    return id
}

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

export async function take_inventory() {
    
    const inventory = await db.get_items()

    const checkJobStatus: any = async (jobId: number) => {
        const job = await db.get_job(jobId)
        if (job.status === types.JobStatus.Completed) {
            const surveyContents = await db.get_survey(jobId)
            
            const chestContents = inventory.filter( x => x.location.chest === job.parameters.chest && x.location.chest_type === job.parameters.chest_type)
            

            // For each location, check if the item and count match
            for (const surveyed of surveyContents) {
                const matchingItem = chestContents.find( x => x.location.slot === surveyed.location.slot && x.location.shulker_slot === surveyed.location.shulker_slot )
                if (matchingItem) {
                    if (matchingItem.count !== surveyed.count) {
                        console.log("ERROR: Item count does not match")
                        console.log(matchingItem)
                        console.log("surveyed: " + surveyed)
                    }
                } else {
                    console.log("ERROR: Item not in database")
                    console.log(surveyed)
                }
            }
            // For each item in the chest, check if it was surveyed
            for (const chestItem of chestContents) {
                const matchingItem = surveyContents.find( x => x.location.slot === chestItem.location.slot && x.location.shulker_slot === chestItem.location.shulker_slot )
                if (!matchingItem) {
                    console.log("ERROR: Item not found")
                    console.log(chestItem)
                }
            }

            return job
        } else {
            await new Promise(r => setTimeout(r, 1000));
            return await checkJobStatus(jobId)
        }

    }

    for(let i = 0; i< INVENTORY_SIZE; i++) {
        const job_id = await db.add_job(types.JobType.Survey, {chest_type: types.ChestType.Inventory, chest: i})
        checkJobStatus(job_id)
    }


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
                _apply_moves(types.ChestType.Inventory, inventory, moves)
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
        let fullShulkers = getFullShulkers(inventory).filter( x => x.inner_item.id === item.id)

        for (const shulker of fullShulkers) {
            if (remainingCount < 27 * item.stack_size) break;

            selectedItems.push({"item": shulker.item, "location": shulker.location, "count": 1,})

            // move shulker contents to with it's shulker above to station chest
            _find_shulker_contents(inventory, shulker.location).forEach( shulker_item => {
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

function _score(inventory: types.ItemLocation[]): number {
    /*
    Gives a score to the current inventory state. The higher the score, the better the inventory state.
    
    Shulker utilization: You want to prioritize shulkers that are full with one type of item, as this 
    maximizes the use of each shulker and reduces the overall number of shulkers needed.
    Slot utilization: You want to minimize the overall number of slots needed, as this reduces the 
    physical space required for the storage system.
    Retrieval time: You want to balance the above factors with the time it takes to retrieve an item from a shulker. 
    Retrieving an item from a shulker that is full with one type of item may be faster than retrieving an item from a shulker with a mix of items.    
    */

    const shulker_utilization_weight = 1
    const slot_utilization_weight = 1
    const retrieval_time_weight = 1

    // Shulker utilization
    const shulker_count = inventory.filter(item => item.item.name.endsWith("shulker_box")).length
    const full_shulker_count = getFullShulkers(inventory).length
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

function getFullShulkers(inventory: types.ItemLocation[]): {item: types.Item, location: types.Location, inner_item: types.Item}[] {
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


export function _apply_moves(chest_type: types.ChestType, inventory: types.ItemLocation[], moves: types.MoveItem[]) {
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