
export async function take_inventory() {
    let result = []

    let counts = global.player.get_counts()
    for (let i = 0; i < counts["inventory"]; i++) {
        result.push(await global.player.open("inventory", i)) 
    }

    let r: any
    let i: any
    for ([i, r] of result.entries()) {
        r = r.map((x:any) => x.chest = i)
    }

    return result.flat()

}

export async function withdraw(items: any, station: number) {
    const chunkSize = 36 // inventory

    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);

        let open_slot = 0
        let prev_chest = null;

        let c: any
        for(c of chunk) {

            let chest: any;
            if ((prev_chest === null) || (prev_chest !== c.chest)) {
                chest = await global.player.open("inventory", c.chest)
                prev_chest = c.chest
            }

            await global.player.lclick(c.slot)


            // place and return extra
            if (c.count == c.available) {
                await global.player.lclick(open_slot + 54)
            } else if (c.count < c.available) {
                for (let _a = 0; _a < c.count; _a += 1) {
                    await global.player.rclick(open_slot + 54)
                }
                await global.player.lclick(c.slot)
            } else {
                console.error('asking for more in slot than avaiable')
            }

            open_slot += 1

        }

        await global.player.open("station", station)

        for (let i = 0; i < open_slot; i++) {
            await global.player.lclick(i + 54)
            await global.player.lclick(i)
        }

    }


}

// {
//     from: {
//         chest_type: "inventory", 
//         chest: 4,
//         slot: 2,
//     }
//     to: {
//         chest_type: "station", 
//         chest: 2,
//         slot: 1,   
//     }
//     count: 4 
// }

export async function move(requests: any) {
    const chunkSize = 36 // inventory

    for (let a = 0; a < requests.length; a += chunkSize) {
        const chunk = requests.slice(a, a + chunkSize);

        let prev_chest = null;

        let c, i: any

        for([i, c] of chunk.entries()) {

            let chest: any;
            if ((prev_chest === null) || (prev_chest !== c.from.chest)) {
                chest = await global.player.open(c.from.chest_type, c.from.chest)
                prev_chest = c.from.chest
            }

            await global.player.lclick(c.from.slot)

            for (let _a = 0; _a < c.count; _a += 1) {
                await global.player.rclick(i + 54)
            }
            await global.player.lclick(c.from.slot)
            
        }

        for([i, c] of chunk.entires()) {

            let chest: any;
            if ((prev_chest === null) || (prev_chest !== c.to.chest)) {
                chest = await global.player.open(c.to.chest_type, c.to.chest)
                prev_chest = c.to.chest
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

