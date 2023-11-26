import * as db from '../model/db'
import * as types from '../types/types'
import * as helper from './helper'
import * as inventory from './inventory'

import { load_config } from '../types/config'
const config = load_config()

const INVENTORY_SIZE = config.build.depth * config.build.width * 6

export async function take_inventory() {
    const inventory = await db.get_inventory_items()

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
                        console.log("surveyed: " + JSON.stringify(surveyed))
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

export async function optimize_inventory() {
    let list = await db.get_inventory_items()

    let items = inventory.summarize(list)

    let moves: types.MoveItem[] = []
    for (const item of items) {
        let items_list = list.filter( x => x.item.id === item.item.id && x.count != x.item.stack_size)
        moves.push(...handle_stacking(items_list))  
    }

    console.log("moves", moves)

    await db.add_job(types.JobType.Move, moves)

}

function handle_stacking(item_locations: types.ItemLocation[]): types.MoveItem[] {
    if (item_locations.length === 0) {
        return []
    }
    const item = item_locations[0].item
    const count = item_locations.reduce( (acc, x) => acc + x.count, 0)

    let sorted_locations = item_locations.sort((a, b) => a.count - b.count);
    let index_moves = optimize_slots(item_locations.map(x => x.count), item.stack_size)

    let moves = index_moves.map( x => ({
        item,
        from: sorted_locations[x[0]].location,
        to: sorted_locations[x[1]].location,
        count: x[2],
    }))

    return moves
}

function optimize_slots(slots: number[], sizeLimit: number): [number, number, number][] {
    let moves: [number, number, number][] = [];

    for (let i = 0; i < slots.length - 1; i++) {
        if (slots[i] === 0) {
            continue; // Skip empty slots
        }

        for (let j = i + 1; j < slots.length; j++) {
            let spaceLeftInNextSlot = sizeLimit - slots[j];

            if (spaceLeftInNextSlot >= slots[i]) {
                // Move entire value from current slot to next if it fits
                moves.push([i, j, slots[i]]);
                slots[j] += slots[i];
                slots[i] = 0;
                break; // Move to the next slot since this one is now empty
            }
        }
    }

    return moves;
}