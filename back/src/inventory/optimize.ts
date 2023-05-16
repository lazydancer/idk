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

function inventory_score(inventory: types.ItemLocation[]): number {
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


function next_move(inventory: types.ItemLocation[]): types.MoveItem {
  // Select a random item
  const item = inventory[Math.floor(Math.random() * inventory.length)];

  // If the item is a shulker box, try again
  if (item.item.name.endsWith("shulker_box")) {
    return next_move(inventory);
  }

  // Select a random destination
  const chest = Math.floor(Math.random() * INVENTORY_SIZE);
  const slot = Math.floor(Math.random() * 54);
  const shulker_slot = Math.random() < 0.5 ? null : Math.floor(Math.random() * 27);

  // Find an item to move to the destination
  const to_move = inventory.find(item => item.location.chest === chest && item.location.slot === slot && item.location.shulker_slot === shulker_slot);

  if (shulker_slot !== null) {
    // Determine if the destination exists (shulker slot with a shulker box)
    const destination_exists = inventory.find(item => item.location.chest === chest && item.location.slot === slot && item.location.shulker_slot === null && item.item.name.endsWith("shulker_box"));
    if (!destination_exists) {
      return next_move(inventory);
    }
  }

  // Determine how many items to move
  let count: number;
  if (!to_move) {
    // If the destination is empty, try to move the entire stack
    count = item.count;
  } else {
    if (to_move.item.id === item.item.id) {
      // If the destination is not empty, try to fill the destination
      count = to_move.item.stack_size - to_move.count;
    } else {
      // If the destination has a different item, try again
      return next_move(inventory);
    }
  }

  // If the count is 0, try again
  if (count === 0) {
    return next_move(inventory);
  }

  // Create and return the move
  return { item: item.item, from: item.location, to: { chest_type: types.ChestType.Inventory, chest, slot, shulker_slot }, count };

}


function a_star(inventory: types.ItemLocation[], limit: number): types.MoveItem[] {
    // Define the A* search node
    interface Node {
      inventory: types.ItemLocation[];
      g: number;
      h: number;
      f: number;
      parent?: Node;
      move?: types.MoveItem;
    }
    
    // Define the start node
    const startNode: Node = {
      inventory,
      g: 0,
      h: inventory_score(inventory),
      f: inventory_score(inventory),
    };
  

    // Define the open and closed sets
    const openSet: Node[] = [startNode];
    const closedSet: Node[] = [];
  
    // Define the main loop
    let moves = 0;
    while (openSet.length > 0 ) {
      // Find the node with the highest f score
      const currentNode = openSet.reduce((a, b) => (a.f > b.f ? a : b));
  
      // If the goal has been reached, return the path
      if (currentNode.h === 0 || moves > limit) {
        const path: types.MoveItem[] = [];
        let node: Node | undefined = currentNode;
        while (node?.parent) {
          path.unshift(node.move!);
          node = node.parent;
        }
        return path;
      }
  
      // Move the current node from the open set to the closed set
      openSet.splice(openSet.indexOf(currentNode), 1);
      closedSet.push(currentNode);
  
      // Generate the next moves
      const nextMoves = [];
      for (let i = 0; i < 1000; i++) {
        nextMoves.push(next_move(currentNode.inventory));
      }
  
      // Evaluate each next move
      for (const nextMove of nextMoves) {
        // Apply the next move to generate the next inventory
        const nextInventory = helper.apply_moves(types.ChestType.Inventory, currentNode.inventory, [nextMove]);

        // Create the next node
        const nextNode: Node = {
          inventory: nextInventory,
          g: currentNode.g + 1,
          h: inventory_score(nextInventory),
          f: currentNode.g + 1 + inventory_score(nextInventory),
          parent: currentNode,
          move: nextMove,
        };
  
        // If the next node is already in the closed set, skip it
        if (closedSet.some((node) => helper.equal_inventories(node.inventory, nextInventory))) {
          continue;
        }
  
        // If the next node is not in the open set, add it
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


export async function sort_inventory() {
    const inventory = await db.get_items()

    console.log("starting sort", inventory_score(inventory))

    const moves = a_star(inventory, 2)

    console.log("recommended", moves, inventory_score(helper.apply_moves(types.ChestType.Inventory, inventory, moves)))

}