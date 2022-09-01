
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

export async function move_items(requests: any) {

    console.log("move", requests)

    const chunkSize = 36 // inventory

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
                await global.player.rclick(i + 54)
            }
            await global.player.lclick(c.from.slot)
            
        }

        for([i, c] of chunk.entries()) {

            if ( !((prev_chest[0] === c.to.chest_type) && (prev_chest[1] === c.to.chest)) ) {
                await global.player.open(c.to.chest_type, c.to.chest)
                prev_chest = [c.to.chest_type, c.to.chest]
            }

            await global.player.lclick(i + 54)
            await global.player.lclick(c.to.slot)
            
        }

    }


}


export async function get_chest_contents(station: number) {
    let r = await global.player.open("station", station)
    return r
}

