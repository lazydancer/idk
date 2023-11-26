import { get } from 'http'
import * as types from '../types/types'
import { get_item_ids } from '../model/db'

const shulker_inventory_start = 27
const double_chest_inventory_start = 54

const player_inventory_size = 27
const shulker_inventory_size = 27
const double_chest_size = 54

export async function move(player: any, requests: types.MoveItem[]) {

    console.log('move', requests)
    requests = structuredClone(requests) // requests is used again outside of this function

    // remove any requests that are in a shulker to be moved within the shulker
    requests = remove_moves_within_shulker(requests)

    // sort by chest and slot
    requests.sort((a, b) =>  (a.from.chest_type - b.from.chest_type) || (a.from.chest - b.from.chest) || (a.from.slot - b.from.slot) )

    // group into max size of 27    
    const chunk = (arr: any[], size: number) => arr.reduce((acc, _, i) => (i % size) ? acc : [...acc, arr.slice(i, i + size)], []);
    let chunks = chunk(requests, 27)

    for (let chunk of chunks) {
        await collect(player, chunk)
        await stash(player, chunk)
    }

}
    
async function collect(player: any, requests: types.MoveItem[]) {
    const from_shulker = requests.filter( (r: any) => (r.from.shulker_slot != null))  
    await move_items_out_of_shulkers(player, from_shulker)

    console.log("request collect", requests.filter( (r: any) => r.from.shulker_slot == null))

    let open_chest = null
    let inventory = null
    for (let req of requests.filter( (r: any) => r.from.shulker_slot == null)) {

        if (open_chest == null || open_chest.chest != req.from.chest || open_chest.chest_type != req.from.chest_type) {
            inventory = await player.open(req.from.chest_type, req.from.chest)
            open_chest = {chest_type: req.from.chest_type, chest: req.from.chest}
        }
        
        const to_slot = await open_slot(player.inventory, req, player_inventory_size)

        const item: any = inventory.find((i: types.ItemLocation) => i.location.slot === req.from.slot)
        await clicks_move_item(player, req.from.slot, double_chest_inventory_start + to_slot, req.count, item.count)
        
        player.inventory_add({item: req.item, location: {chest_type: types.ChestType.Player, chest: 0, slot: to_slot, shulker_slot: req.to.shulker_slot}, count: req.count})
    }
}

async function stash(player: any, requests: types.MoveItem[]) {
    const to_shulker = requests.filter( (r: any) => (r.to.shulker_slot != null))  
    await move_items_into_shulkers(player, to_shulker)

    let open_chest = {chest_type: types.ChestType.Player, chest: 0}
    let inventory: types.ItemLocation[] = []

    for (let req of requests.filter( (r: any) => (r.to.shulker_slot == null))) {
        if (open_chest == null || open_chest.chest != req.to.chest || open_chest.chest_type != req.to.chest_type) {
            inventory = await player.open(req.to.chest_type, req.to.chest)
            open_chest = {chest_type: req.to.chest_type, chest: req.to.chest}
        }

        const player_item = player.inventory.find( (x: any) => x.item.id == req.item.id && x.count >= req.count)

        if(!player_item) {
            throw new Error(`Player does not have ${req.count} ${req.item.name}`)
        }

        const from_slot = double_chest_inventory_start + player_item.location.slot;
        const to_slot = req.to.chest_type === types.ChestType.Station ? open_slot(inventory, req, double_chest_size) : req.to.slot;

        await clicks_move_item(player, from_slot, to_slot, req.count, player_item.count)

		// update inventory
		const item: any = inventory.find((i: types.ItemLocation) => i.location.slot === to_slot)
		if (item) {
			item.count += req.count
		} else {
            if (req) {
                inventory.push({item: req.item, location: {chest_type: req.to.chest_type, chest: req.to.chest, slot: to_slot, shulker_slot: req.to.shulker_slot}, count: req.count})
            }
        }

        player.inventory_remove(player_item, req.count)
    }

}


function remove_moves_within_shulker(requests: types.MoveItem[]) {
    const shulkers = requests.filter( (r: any) => r.item.name.endsWith("shulker_box"));

    let indexes_to_remove: any[] = []

    for (const shulker of shulkers) {
        indexes_to_remove.push(requests.filter( (request: any) => 
            (request.from.shulker_slot != null)
            // from matches
            && (request.from.chest_type == shulker.from.chest_type)
            && (request.from.chest == shulker.from.chest)
            && (request.from.slot == shulker.from.slot)
            // to matches
            && (request.to.chest_type == shulker.to.chest_type)
            && (request.to.chest == shulker.to.chest)
            && (request.to.slot == shulker.to.slot)

            && (request.from.shulker_slot == request.to.shulker_slot)
        ).map( (r:any) => requests.indexOf(r)).flat())
    }

    indexes_to_remove = indexes_to_remove.flat();

    return requests.filter((_, i) => !indexes_to_remove.includes(i))
}

async function move_items_out_of_shulkers(player: any, requests: types.MoveItem[]) {

    // group by shulker
    const grouped = requests.reduce((r: any, a: any) => {
        r['chesttype' + a.from.chest_type + 'chest' + a.from.chest + 'slot' + a.from.slot] = [...r['chesttype' + a.from.chest_type + 'chest' + a.from.chest + 'slot' + a.from.slot] || [], a];
        return r;
    }, {});

    // for each shulker move items
    for (const key in grouped) {
        const first_move = grouped[key][0]

        const shulker_inventory = await player.open_shulker(first_move.from.chest_type, first_move.from.chest, first_move.from.slot)
        for( let [i, move] of grouped[key].entries() ) {
            let to_slot = open_slot(player.inventory, move.item, player_inventory_size)

            const item: any = shulker_inventory.find((i: types.ItemLocation) => i.location.slot === move.from.shulker_slot)
            await clicks_move_item(player, move.from.shulker_slot!, shulker_inventory_start + to_slot, move.count, item.count)
            
            player.inventory_add({item: move.item, location: {chest_type: types.ChestType.Player, chest: 0, slot: to_slot, shulker_slot: null}, count: move.count})
        }
        await player.close_shulker()
    }

}

async function move_items_into_shulkers(player: any, requests: types.MoveItem[]) {
    const shulker_inventory_start = 27
    const double_chest_inventory_start = 54


    const to_move = requests.filter( (r: any) => (r.from.shulker_slot == null) && (r.to.shulker_slot != null))


    let updated_requests = []
    for( let move of to_move ) {
        // Find shulker (moving with)
        let found = requests.find( (r: any) => 
            ( r != move )
            && (move.to.chest_type == r.to.chest_type)
            && (move.to.chest == r.to.chest)
            && (move.to.slot == r.to.slot)
        )

        if (found) {
            let chest_inventory = await player.open(move.from.chest_type, move.from.chest)
            const item: any = chest_inventory.find((i: types.ItemLocation) => i.location.slot === move.from.slot)

            await clicks_move_item(player, move.from.slot, double_chest_inventory_start, move.count, item.count)

            await player.open_shulker(found.from.chest_type, found.from.chest, found.from.slot)

            await clicks_move_item(player, shulker_inventory_start, move.to.shulker_slot!, move.count, item.count)

            await player.close_shulker()

            // update from to the new position

            updated_requests.push({
                item: move.item,
                to: move.to,
                from: found.from,
                count: move.count,
            })

        } else {
            // "actions" has to trust "inventory" that a shulker is already there
            let chest_inventory = await player.open(move.from.chest_type, move.from.chest)
            const item: any = chest_inventory.find((i: types.ItemLocation) => i.location.slot === move.from.slot)

            await clicks_move_item(player, move.from.slot, double_chest_inventory_start, move.count, item.count)

            await player.open_shulker(move.to.chest_type, move.to.chest, move.to.slot)

            await clicks_move_item(player, shulker_inventory_start, move.to.shulker_slot!, move.count, item.count)

            await player.close_shulker()
        }

        
    }


    // requests.concat(updated_requests)


    // return requests

}

function open_slot(inventory: types.ItemLocation[], item: types.MoveItem, inventory_size: number): number {
    /**
     * Given an item and an inventory, returns a list of moves that move the item to the first available slot in the inventory.
     * Will not stack on non-full existing item to ensure consistency with the database.
     */

    // Then find open spaces
    for (let i = 0; i < inventory_size; i++) {
        if (!inventory[i]) {
            return i
        }
    }

    // throw error
    throw new Error("No open slots in inventory")
}



async function clicks_move_item(player: any, from_slot: number, to_slot: number, count: number, from_slot_count: number) {
    if (count === from_slot_count) {
        await player.lclick(from_slot);
        await player.lclick(to_slot);
    } else {
        let right_click_amount = Math.ceil(from_slot_count / 2)
        if (count > right_click_amount) {
            await player.lclick(from_slot); 

            let excess_count = from_slot_count - count;
            for (let i = 0; i < excess_count; i++) {
                await player.rclick(from_slot); // Place back excess items.
            }

            await player.lclick(to_slot);
        } else {
            await player.rclick(from_slot); // Pick up half of the items.

            for (let i = 0; i < count; i++) {
                await player.rclick(to_slot);
            }

            if(count < right_click_amount) {
                await player.lclick(from_slot); // Place back excess items.
            }
        }
    }
}


export async function survey(player: any, chest_type: types.ChestType, chest: number) {
    /*
        Survey a chest returning contents
    */
    let items = await player.open(chest_type, chest)
    
    let shulkers = []
    for (const box of items.filter( (x:any) => x.item.name.endsWith("shulker_box"))) {
        shulkers.push(shulkerContents(box))
    }
    items = items.concat(shulkers.flat())
    return items
}


function shulkerContents(input: any): types.ItemLocation[] {
    /*
     * Given a shulker, returns a list of items in the shulker, extracted from nbt data
     */

    // return early if shulker is empty
    if (!input.item.nbt || !input.item.nbt.value) {
        return []
    }

    const items: any[] = input.item.nbt.value.BlockEntityTag.value.Items.value.value;
    const output: any[] = [];

    

    for (let item of items) {
      const name = item.id.value.split(':').pop();
      const count = item.Count.value;
      const shulker_slot = item.Slot.value;
      let nbt = item.tag ? item.tag : null;
      // add name: "" to nbt
      if (nbt) {
        nbt["name"] = ""            
      }
    
      // Does the best guess of these values, if in database is replaced with the correct values
      const display_name = name.replace('minecraft:', '').replace('_', ' ').replace(/\b\w/g, (l:any) => l.toUpperCase()); // Capitalize first letter of each word and remove underscores

      // Stack size is not avaiable from the shulker box, so we have to guess...
      let stack_size = 64; // We assume all shulker box contents are stackable items with a stack size of 64
      // if tool or armour, set stack size to 1
      const unstackable = ['sword', 'pickaxe', 'axe', 'hoe', 'shovel', 'helmet', 'chestplate', 'leggings', 'boots', 'horse_armor', 'elytra', 'trident', 'shield', 'crossbow', 'carrot_on_a_stick', 'fishing_rod', 'flint_and_steel', 'shears', 'bow', 'shield', 'totem_of_undying', 'potion', 'splash_potion', 'lingering_potion', 'banner', 'enchanted_book', 'bed', 'minecart', 'music_disc', 'minecart', 'milk_bucket', 'tnt_minecart', 'hopper_minecart', 'chest_minecart', 'furnace_minecart', 'boat', 'elytra', 'saddle', 'spawn_egg', 'writable_book', 'written_book', 'map', 'compass', 'clock', 'ender_pearl', 'ender_eye', 'dragon_breath', 'totem_of_undying', 'crossbow', 'stew', 'bucket_of_fish', 'bucket_of_axolotl', 'soup']
      if (unstackable.some((x: string) => name.includes(x))) {
        stack_size = 1;
      }
      // if stack of 16, set stack size to 16
      const throwables =  ["snowball", "empty_bucket", "egg", "sign", "hanging_sign", "honey_bottle", "banner", "written_book", "ender_pearl", "armor_stand"]
      if (throwables.some((x: string) => name.includes(x))) {
        stack_size = 16;
      }  

      output.push({
        item: {
          id: 0,
          name: name,
          metadata: 0,
          nbt,
          display_name,
          stack_size
        },
        location: {
          chest_type: input.location.chest_type,
          chest: input.location.chest,
          slot: input.location.slot,
          shulker_slot
        },
        count
      });
    }
    
    console.log(output)
    get_item_ids(output.map((x: any) => x.item))
    console.log(output)


    return output;
}


