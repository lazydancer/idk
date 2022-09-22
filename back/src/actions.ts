import * as types from './types'


export async function move_items(requests: {item: types.Item, from: types.Location, to: types.Location, count: number}[]) {
    requests = structuredClone(requests)

    // Each of the following actions removes the resecptive actions
    // filter out full shulker moves (don't need to move individual items in the shulker)
    requests = filter_internal_shulker_moves(requests)

    requests = await move_items_out_of_shulkers(requests)
    requests = await move_items_into_shulkers(requests)

    await move_normal(requests)


}


function filter_internal_shulker_moves(requests: {item: types.Item, from: types.Location, to: types.Location, count: number}[]) {
    const boxes = requests.filter( (r: any) => r.item.name.endsWith("shulker_box"));

    let result: any[] = []

    for (const c of boxes) {
        result.push(requests.filter( (r: any) => 
            // If is in a shulker 
                (r.from.shulker_slot != null)
            // If is moving with the shukler
            && (r.from.chest_type == c.from.chest_type)
            && (r.from.chest == c.from.chest)
            && (r.from.slot == c.from.slot)
            && (r.to.chest_type == c.to.chest_type)
            && (r.to.chest == c.to.chest)
            && (r.to.slot == c.to.slot)
            // If stays in the same slot
            && (r.from.shulker_slot == r.to.shulker_slot)
        ).map( (x:any) => requests.indexOf(x)).flat())
    }

    result = result.flat();

    // Remove self
    for (const i of result.sort().reverse()) {
        requests.splice(i, 1);
    }

    return requests

}

async function move_items_out_of_shulkers(requests: {item: types.Item, from: types.Location, to: types.Location, count: number}[]) {
    const shulker_inventory_start = 27
    const double_chest_inventory_start = 54

    const to_move = requests.filter( (r: any) => (r.from.shulker_slot != null) && (r.to.shulker_slot == null))

    for (const move of to_move) {
        await global.player.open_shulker(move.from.chest_type, move.from.chest, move.from.slot)        
        await clicks_move_item(move.from.shulker_slot!, shulker_inventory_start, move.count)
        await global.player.close_shulker()

        await global.player.open(move.to.chest_type, move.to.chest)
        await clicks_move_item(double_chest_inventory_start, move.to.slot!, move.count)
        await global.player.close()
    }


    for (const i of to_move.map((m: any) => requests.indexOf(m)).sort().reverse()) {
        requests.splice(i, 1);
    }

    return requests

}

async function move_items_into_shulkers(requests: {item: types.Item, from: types.Location, to: types.Location, count: number}[]) {
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
            await global.player.open(move.from.chest_type, move.from.chest)

            await clicks_move_item(move.from.slot, double_chest_inventory_start, move.count)

            await global.player.open_shulker(found.from.chest_type, found.from.chest, found.from.slot)

            await clicks_move_item(shulker_inventory_start, move.to.shulker_slot!, move.count)

            await global.player.close_shulker()

            // update from to the new position

            updated_requests.push({
                item: move.item,
                to: move.to,
                from: found.from,
                count: move.count,
            })


        } else {
            // "actions" has to trust "inventory" that a shulker is already there
            await global.player.open(move.from.chest_type, move.from.chest)

            await clicks_move_item(move.from.slot, double_chest_inventory_start, move.count)

            await global.player.open_shulker(move.to.chest_type, move.to.chest, move.to.slot)

            await clicks_move_item(shulker_inventory_start, move.to.shulker_slot!, move.count)

            await global.player.close_shulker()
        }

        
    }

    for (const i of to_move.map((m: any) => requests.indexOf(m)).sort().reverse()) {
        requests.splice(i, 1);
    }

    requests.concat(updated_requests)


    return requests

}

async function move_normal(requests: {item: types.Item, from: types.Location, to: types.Location, count: number}[]) {
    const chunkSize = 27 // inventory (except hotbar)
    const inventoryStart = 54

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
                await global.player.open(req.from.chest_type, req.from.chest)
                prev_chest = { chest_type: req.from.chest_type, chest: req.from.chest }
            }

            await clicks_move_item(req.from.slot, i + inventoryStart, req.count)            
        }

        // Move from inventory to chest
        for(let [i, req] of chunk.entries()) {

            if ( !equals_chest(prev_chest, req.to) ) {
                await global.player.open(req.to.chest_type, req.to.chest)
                prev_chest = { chest_type: req.to.chest_type, chest: req.to.chest }
            }

            await clicks_move_item(i + inventoryStart, req.to.slot, req.count)            
            
        }

    }
}

export async function take_inventory() {
    let result = []

    let counts = global.player.get_counts()
    for (let chest = 0; chest < counts["inventory"]; chest++) {
        let inv = await global.player.open(types.ChestType.Inventory, chest)

        inv = inv.map((x: any) => ({...x, chest: chest, shulker_slot: null}))
        result.push(inv) 

        // Open each shulker to record internals
        for (const box of inv.filter( (x: any) => x.name.endsWith("shulker_box"))) {
            let shulker_contents = await global.player.open_shulker(types.ChestType.Inventory, chest, box.slot)
            await global.player.close_shulker()

            shulker_contents.forEach((x: any) => {
                x["slot"] = box.slot;
                x["chest"] = chest;
            })

            result.push(shulker_contents)
        }
    }

    return result.flat()

}


export async function get_chest_contents(station: number) {
    let r = await global.player.open(types.ChestType.Station, station)
    return r
}

export async function get_shukler_contents(station: number, slot: number) {
    let r = await global.player.open_shulker(types.ChestType.Station, station, slot)
    await global.player.close_shulker()

    return r
}

export function get_counts() {
    return global.player.get_counts()
}

async function clicks_move_item(from_slot: number, to_slot: number, count: number) {
    await global.player.lclick(from_slot)

    for (let _a = 0; _a < count; _a += 1) {
        await global.player.rclick(to_slot)
    }
    await global.player.lclick(from_slot)
}

// async function test_request() {

//     await new Promise(r => setTimeout(r, 7000))

//     const requests = [
//         {
//             "item": {"name": "dirt"},
//             "from": {
//                 "chest_type": types.ChestType.Station,
//                 "chest": 0,
//                 "slot": 0,
//                 "shulker_slot": null,
//             },
//             "to": {
//                 "chest_type": types.ChestType.Station,
//                 "chest": 0,
//                 "slot": 1,
//                 "shulker_slot": 0,
//             },
//             "count": 1,
//         }
//     ]
//     move_items(requests)
// }
// test_request()