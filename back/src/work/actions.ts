import * as types from '../types/types'


const shulker_inventory_start = 27
const double_chest_inventory_start = 54

export async function move(player: any, requests: types.MoveItem[]) {
    /*
        Move items between chests
    */
    requests = structuredClone(requests)

    requests = remove_moves_within_shulker(requests)

    requests = await move_items_out_of_shulkers(player, requests)
    requests = await move_items_into_shulkers(player, requests)


    requests = requests.sort( (a, b) => a.from.chest - b.from.chest)

    // check player inventory is empty
    const inventory = player.player_inventory()
    if (inventory.length > 0) {
        throw new Error('Player inventory is not empty')
    }


    const chunkSize = 27 // inventory (except hotbar)

    for (let a = 0; a < requests.length; a += chunkSize) {
        const chunk = requests.slice(a, a + chunkSize);

        let prev_chest = {
            chest_type: types.ChestType.Inventory,
            chest:  -1,
        };

        const equals_chest = (a: any, b: any) =>  (a.chest_type === b.chest_type) && (a.chest === b.chest)

        // Move from chest to inventory
        for(let [i, req] of chunk.entries()) {

            if ( !equals_chest(prev_chest, req.from) ) {
                await player.open(req.from.chest_type, req.from.chest)
                prev_chest = { chest_type: req.from.chest_type, chest: req.from.chest }
            }

            await clicks_move_item(player, req.from.slot, i + double_chest_inventory_start, req.count)            
        }

        // Move from inventory to chest
        for(let [i, req] of chunk.entries()) {
            let contents
            if ( !equals_chest(prev_chest, req.to) ) {
                contents = await player.open(req.to.chest_type, req.to.chest)
                prev_chest = { chest_type: req.to.chest_type, chest: req.to.chest }
            }

            if( req.to.chest_type == types.ChestType.Station ) {
                // get first open slot(s) for the item
                // if none, throw error
                let open_slot_moves = first_slot(contents, req)

                if (open_slot_moves.length == null) {
                    throw new Error('No open slots for item')
                }

                // move item to open slot(s)
                for (const move of open_slot_moves) {
                    console.log("open slot move: ", move) 
                    await clicks_move_item(player, i + double_chest_inventory_start, move.to.slot, req.count)
                }

                // update contents
                contents = await player.open(req.to.chest_type, req.to.chest)

            } else {
                await clicks_move_item(player, i + double_chest_inventory_start, req.to.slot, req.count)            
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

    const to_move = requests.filter( (r: any) => (r.from.shulker_slot != null) && (r.to.shulker_slot == null))  

    // group by shulker
    const grouped = to_move.reduce((r: any, a: any) => {
        r['chesttype' + a.from.chest_type + 'chest' + a.from.chest + 'slot' + a.from.slot] = [...r['chesttype' + a.from.chest_type + 'chest' + a.from.chest + 'slot' + a.from.slot] || [], a];
        return r;
    }, {});

    // for each shulker move items
    for (const key in grouped) {
        const first_move = grouped[key][0]

        await player.open_shulker(first_move.from.chest_type, first_move.from.chest, first_move.from.slot)
        for( let [i, move] of grouped[key].entries() ) {
            await clicks_move_item(player, move.from.shulker_slot!, shulker_inventory_start + i, move.count)
        }
        await player.close_shulker()

        await player.open(first_move.to.chest_type, first_move.to.chest)
        for( let [i, move] of grouped[key].entries() ) {
            await clicks_move_item(player, double_chest_inventory_start + i, move.to.slot!, move.count)
        }
        await player.close()

    }

    for (const i of to_move.map((m: any) => requests.indexOf(m)).sort().reverse()) {
        requests.splice(i, 1);
    }

    return requests

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
            await player.open(move.from.chest_type, move.from.chest)

            await clicks_move_item(player, move.from.slot, double_chest_inventory_start, move.count)

            await player.open_shulker(found.from.chest_type, found.from.chest, found.from.slot)

            await clicks_move_item(player, shulker_inventory_start, move.to.shulker_slot!, move.count)

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
            await player.open(move.from.chest_type, move.from.chest)

            await clicks_move_item(player, move.from.slot, double_chest_inventory_start, move.count)

            await player.open_shulker(move.to.chest_type, move.to.chest, move.to.slot)

            await clicks_move_item(player, shulker_inventory_start, move.to.shulker_slot!, move.count)

            await player.close_shulker()
        }

        
    }

    for (const i of to_move.map((m: any) => requests.indexOf(m)).sort().reverse()) {
        requests.splice(i, 1);
    }

    requests.concat(updated_requests)


    return requests

}

function first_slot(inventory: any[], item: types.MoveItem): types.MoveItem[] {
    /**
     * Given an item and an inventory, returns a list of moves that move the item to the first available slot(s) in the inventory.
     * If there are existing slots that already contain the item, moves as many items as possible to those slots first.
     * If there are still items remaining, moves the remaining items to the first available open slots.
     */

    let remaining_count = item.count
    let result = []

    console.log("inventory", inventory)

    // First find existing items
    let first_slot = inventory.findIndex((i: any) => i && i.item.id === item.item.id && i.count < i.item.stack_size)
    while (first_slot !== -1 && remaining_count > 0) {
        console.log("over existing item")
        // If there's an existing item, move from the first available slot
        const move_count = Math.min(remaining_count, item.item.stack_size - inventory[first_slot].count)
        result.push({
            item: item.item,
            count: move_count,
            from: item.from,
            to: {slot: first_slot, chest: item.to.chest, chest_type: item.to.chest_type, shulker_slot: item.to.shulker_slot}
        })
        remaining_count -= move_count
        first_slot = inventory.findIndex((i: any) => i && i.id === item.item.id && i.Count < i.item.stack_size && i.slot !== first_slot)
    }

    // Then find open spaces
    if (remaining_count > 0) {
        for (let i = 0; i < 54 && remaining_count > 0; i++) {
            if (!inventory[i]) {
                // If there's an open space, move from the original slot to the open space
                const move_count = Math.min(remaining_count, item.item.stack_size)
                result.push({
                    item: item.item,
                    count: move_count,
                    from: item.from,
                    to: {slot: i, chest: item.to.chest, chest_type: item.to.chest_type, shulker_slot: item.to.shulker_slot}
                })
                remaining_count -= move_count
            }
        }
    }

    return result
}



function shulkerContents(input: any): any[] {

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
    
    return output;
  }



async function clicks_move_item(player: any, from_slot: number, to_slot: number, count: number) {
    await player.lclick(from_slot)

    if (count == 64) {
        await player.lclick(to_slot)
    } else {
        for (let _a = 0; _a < count; _a += 1) {
            await player.rclick(to_slot)
        }
    }
    
    await player.lclick(from_slot)
}