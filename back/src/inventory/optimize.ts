import * as db from '../model/db'
import * as types from '../types/types'
import * as helper from './helper'
import * as inventory from './inventory'

import { load_config } from '../types/config'
const config = load_config()

import { parentPort } from 'worker_threads'

const INVENTORY_SIZE = config.build.depth * 2*config.build.width * 6

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

function inventory_cost(inventory: types.ItemLocation[]): number {
    /*
    Calculates the cost of the current inventory state. The higher the cost, the less efficient the inventory state.
    */
    
    // Calculating total cost
    let occupied_slots = inventory.length;

    // To help entice the algorithm to move items into shulkers, we reduce the cost of items in shulker boxes
    inventory.filter(x => x.location.shulker_slot !== null).forEach(x => occupied_slots -= 0.5)

    // Remove shulker boxes from occupied slots when shulker box is full
    let fullShulkers = helper.get_full_shulkers(inventory)
    occupied_slots -= fullShulkers.length * 27

    return occupied_slots
}


function neighbours(list: types.ItemLocation[]): types.MoveItem[] {
    const neighbours: types.MoveItem[] = []

    const items = list.filter(item => !item.item.name.endsWith("shulker_box"))

    for (const item of items) {
        const destinations = list.filter(destination => 
            destination.item.id === item.item.id && 
            destination.count < destination.item.stack_size && 
            item.count != item.item.stack_size)

        // remove itself from destinations
        const index = destinations.findIndex(x => x.location === item.location)
        if (index > -1) {
            destinations.splice(index, 1)
        }

        // For each destination, create a move
        for (const destination of destinations) {
            const count = Math.min(item.count, destination.item.stack_size - destination.count)
            neighbours.push({
                item: item.item,
                from: item.location,
                to: destination.location,
                count,
            })
        }
       

        // Find shulkers which can be moved into with same items or empty
        const not_full_shulkers = helper.get_non_full_shulkers(list, item.item)
        for(let shulker of not_full_shulkers) {
            let shulker_contents = helper.find_shulker_contents(list, shulker.location)

            if (shulker_contents.length === 0) {
                neighbours.push({
                    item: item.item,
                    from: item.location,
                    to: {...shulker.location, shulker_slot: 0},
                    count: item.count,
                })
                continue
            }

            for(let i = 0; i < 27; i++) {
                let shulker_slot = shulker_contents.find(x => x.location.shulker_slot === i)
                if (shulker_slot === undefined) {
                    neighbours.push({
                        item: item.item,
                        from: item.location,
                        to: {...shulker_contents[0].location, shulker_slot: i},
                        count: item.count,
                    })
                    break
                }
            }

        }

        // Potentially move item out of shulker
        if (item.location.shulker_slot !== null) {
            const max_chest = Math.max(...list.map(x => x.location.chest))
            const open_slot = inventory.get_open_slots(list, max_chest)[0]
            if (open_slot) {
                neighbours.push({
                    item: item.item,
                    from: item.location,
                    to: open_slot,
                    count: item.count,
                })
            }    
        }


    }
    
    return neighbours

}

function a_star(inventory: types.ItemLocation[], limit: number): types.MoveItem[] {

    interface Node {
        inventory: types.ItemLocation[];
        g: number; // steps cost
        h: number; // heuristic (cost)
        f: number; // total cost
        parent?: Node;
        move?: types.MoveItem;
    }

    const startNode: Node = {
        inventory,
        g: 0,
        h: inventory_cost(inventory),
        f: inventory_cost(inventory),
    };
    const openSet: Node[] = [startNode];
    const closedSet: Node[] = [];

    let moves = 0;
    while (openSet.length > 0 ) {
        const currentNode = openSet.reduce((a, b) => (a.f < b.f ? a : b)); // Find the node with the lowest f score

        console.log("moves", moves, "f", currentNode.f, "g", currentNode.g, "h", currentNode.h)

        // If the goal has been reached, return the path
        if (moves > limit) {
            const path: types.MoveItem[] = [];
            let node: Node | undefined = closedSet.reduce((a, b) => (a.f < b.f ? a : b)); // Find the node with the lowest f score;
            while (node?.parent) {
                path.unshift(node.move!);
                node = node.parent;
            }
            return path;
        }

        openSet.splice(openSet.indexOf(currentNode), 1);
        closedSet.push(currentNode);

        const nextMoves = [];
        nextMoves.push(...neighbours(currentNode.inventory));

        for (const nextMove of nextMoves) {
            const nextInventory = helper.apply_moves(types.ChestType.Inventory, currentNode.inventory, [nextMove]);
            
            if (closedSet.some((node) => helper.equal_inventories(node.inventory, nextInventory))) {
                continue;
            }
            
            const cost = inventory_cost(nextInventory)

            const step_cost = 0.5

            const nextNode: Node = {
                inventory: nextInventory,
                g: currentNode.g + step_cost,
                h: cost,
                f: currentNode.g + step_cost + cost,
                parent: currentNode,
                move: nextMove,
            };


            const existingNode = openSet.find((node) => helper.equal_inventories(node.inventory, nextInventory));
            if (!existingNode) {
                openSet.push(nextNode);
            } else if (nextNode.g < existingNode.g) {
                // If the next node is in the open set and has a lower g score, update it
                existingNode.g = nextNode.g;
                existingNode.f = nextNode.f;
                existingNode.parent = nextNode.parent;
                existingNode.move = nextNode.move;
            }
        }

        moves++;
    }

    // If the goal cannot be reached, return the original inventory
    return [];
  }


export async function optimize_inventory() {
    const inventory = await db.get_inventory_items()

    console.log("starting cost", inventory_cost(inventory))

    const moves = a_star(inventory, 100)

    console.log("recommended", moves, inventory_cost(helper.apply_moves(types.ChestType.Inventory, inventory, moves)))

    await db.add_job(types.JobType.Move, moves)

    parentPort?.postMessage('done');
}

parentPort?.on('message', (task) => {
    if (task === 'optimize_inventory') {
        optimize_inventory();
    }
});
