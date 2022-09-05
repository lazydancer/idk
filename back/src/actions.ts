


export async function move_items(requests: any) {

    console.log("move", requests)


    requests = structuredClone(requests)
    // move_items converts a group of move requests to player requests
    console.log("clone", requests)

    // filter full shulker moves
    requests = filter_internal_shulker_moves(requests)
    console.log("filter internal shulker movess", requests)

    // move items out of shulker
    requests = await move_items_from_shulker(requests)
    console.log("move items from shukler", requests)


    const chunkSize = 27 // inventory (except hotbar)
    const inventoryStart = 54

    for (let a = 0; a < requests.length; a += chunkSize) {
        const chunk = requests.slice(a, a + chunkSize);

        let prev_chest = [null, null];

        let c, i: any

        for([i, c] of chunk.entries()) {

            if ( !((prev_chest[0] === c.from.chest_type) && (prev_chest[1] === c.from.chest)) ) {
                await global.player.open(c.from.chest_type, c.from.chest)
                prev_chest = [c.from.chest_type, c.from.chest]
            }

            await global.player.lclick(c.from.slot)

            for (let _a = 0; _a < c.count; _a += 1) {
                await global.player.rclick(i + inventoryStart)
            }
            await global.player.lclick(c.from.slot)
            
        }

        for([i, c] of chunk.entries()) {

            if ( !((prev_chest[0] === c.to.chest_type) && (prev_chest[1] === c.to.chest)) ) {
                await global.player.open(c.to.chest_type, c.to.chest)
                prev_chest = [c.to.chest_type, c.to.chest]
            }

            await global.player.lclick(i + inventoryStart)
            await global.player.lclick(c.to.slot)
            
        }

    }


}


function filter_internal_shulker_moves(requests: any) {
    const boxes = requests.filter( (r: any) => r.item.name.endsWith("shulker_box"));

    console.log("boxes", boxes)

    let r: any[] = []

    for (const c of boxes) {

        r.push(requests.filter( (r: any) => 
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

    r = r.flat();

    for (const i of r.sort().reverse()) {
        requests.splice(i, 1);
    }

    return requests

}

async function move_items_from_shulker(requests: any) {
    const shulker_inventory_start = 27
    const double_chest_inventory_start = 54

    const to_move = requests.filter( (r: any) => (r.from.shulker_slot != null) && (r.to.shulker_slot == null))


    for (const move of to_move) {
        await global.player.open_shulker(move.from.chest_type, move.from.chest, move.from.slot)
        
        await global.player.lclick(move.from.shulker_slot)
        for(let i=0; i < move.count; i++) {
            await global.player.rclick(shulker_inventory_start)
        }
        await global.player.lclick(move.from.shulker_slot)

        await global.player.close_shulker()

        await global.player.open(move.to.chest_type, move.to.chest)

        await global.player.lclick(double_chest_inventory_start)
        await global.player.lclick(move.to.slot)
    }


    for (const i of to_move.map((m: any) => requests.indexOf(m)).sort().reverse()) {
        requests.splice(i, 1);
    }

    return requests

}

export async function take_inventory() {
    let result = []

    let counts = global.player.get_counts()
    // for (let i = 0; i < counts["inventory"]; i++) {
    for (let chest = 0; chest < 18; chest++) {
        let inv = await global.player.open("inventory", chest)

        inv = inv.map((x: any) => ({...x, chest: chest, shulker_slot: null}))
        result.push(inv) 

        // Open each shulker to record internals
        for (const box of inv.filter( (x: any) => x.name.endsWith("shulker_box"))) {
            let shulker_contents = await global.player.open_shulker("inventory", chest, box.slot)
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
    let r = await global.player.open("station", station)
    return r
}

export async function get_shukler_contents(station: number, slot: number) {
    let r = await global.player.open_shulker("station", station, slot)
    await global.player.close_shulker()

    return r
}

export function get_counts() {
    return global.player.get_counts()
}

