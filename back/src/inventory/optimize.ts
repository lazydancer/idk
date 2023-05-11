import * as db from '../model/db'
import * as types from '../types/types'
import * as helper from './helper'


import { load_config } from '../types/config'
const config = load_config()

const INVENTORY_SIZE = config.build.depth * config.build.width * 6

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
    const full_shulker_count = helper.get_full_shulkers(inventory).length
    const shulker_utilization = full_shulker_count / shulker_count

    // Slot utilization
    const slots_count = inventory.filter(item => item.location.shulker_slot === null).length
    const items_count = inventory.length
    const slot_utilization = items_count / slots_count

    // Retrieval time
    // For each shulker, determine the number of unique items in it
    const unique_items = inventory.filter(item => item.item.name.endsWith("shulker_box")).map(shulker => {
        const subslots = helper.find_shulker_contents(inventory, shulker.location)
        // return the number of unique items in this shulker
        return subslots.map(subslot => subslot.item.id).filter((value, index, self) => self.indexOf(value) === index).length

    })
    const average_unique_items = unique_items.reduce((a, b) => a + b, 0) / unique_items.length

    return shulker_utilization_weight * shulker_utilization + slot_utilization_weight * slot_utilization - retrieval_time_weight * average_unique_items
}