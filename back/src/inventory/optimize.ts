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
