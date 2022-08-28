
export async function take_inventory() {
    let result = []

    let counts = global.player.get_counts()
    // for (let i = 0; i < counts["inventory"]; i++) {
    for (let i = 0; i < 7; i++) {
        let inv = await global.player.open("inventory", i)
        result.push(inv) 
    }

    let r: any
    let i: any
    for ([i, r] of result.entries()) {
        r = r.map((x:any) => x.chest = i)
    }

    return result.flat()

}

export async function move(requests: any) {

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

