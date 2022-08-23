import { Pool } from "pg";
const pool = new Pool({
    host: "localhost",
    user: "mc-inventory",
    database: "mc-inventory",
    password: "pineapple",
    port: 5432
})


export async function getItems(): Promise<any> {
    try {
        const a = await pool.query("SELECT * FROM items")
        return a["rows"]
    } catch(err) {
        console.log(err)
    }
} 

// Group items for total counts
export async function getSummary(): Promise<any> {
    try {
        const a = await pool.query("SELECT metadata, nbt, name, MAX(display_name) as display_name, SUM(count) as count FROM items GROUP BY metadata, nbt, name")
        return a["rows"]
    } catch(err) {
        console.log(err)
    }
} 

export async function insert(items: any): Promise<any> {

    for (const item of items) {
        await pool.query("INSERT INTO items (metadata, name, display_name, stack_size, slot, count, nbt, chest) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [item.metadata, item.name, item.display_name, item.stack_size, item.slot, item.count, item.nbt, item.chest])
    }

}

export async function remove(items: any): Promise<any> {

    for (const item of items) {
        await pool.query("UPDATE items SET count = count - $1 WHERE slot=$2 and chest=$3",
        [item.count, item.slot, item.chest])
    }

    await pool.query("DELETE FROM items WHERE count = 0")


}


export async function apply_moves(moves: any): Promise<any> {

    for (const move of moves) {

        if ( move.from.chest_type == "inventory" ) {
            await pool.query("UPDATE items SET count = count - $1 WHERE slot=$2 and chest=$3",
            [move.count, move.from.slot, move.from.chest])

        }
        await pool.query("DELETE FROM items WHERE count = 0")

        if ( move.to.chest_type == "inventory") {
            let query_string = 
                `IF EXISTS (SELECT * FROM items WHERE WHERE slot=$5 and chest=$8)
                BEGIN
                    UPDATE items SET count = count + $6 WHERE slot=$5 and chest=$8
                END
                ELSE
                BEGIN
                    INSERT INTO items (metadata, name, display_name, stack_size, slot, count, nbt, chest) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                END`

            await pool.query(query_string, [item.metadata, item.name, item.display_name, item.stack_size, item.slot, item.count, item.nbt, item.chest])
        }

    }


}




let a = [
    {
      from: { chest_type: 'station', chest: 2, slot: 0 },
      to: { chest_type: 'inventory', chest: 0, slot: 0 },
      count: 3
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 1 },
      to: { chest_type: 'inventory', chest: 0, slot: 1 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 2 },
      to: { chest_type: 'inventory', chest: 0, slot: 6 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 3 },
      to: { chest_type: 'inventory', chest: 0, slot: 21 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 4 },
      to: { chest_type: 'inventory', chest: 0, slot: 37 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 5 },
      to: { chest_type: 'inventory', chest: 0, slot: 40 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 6 },
      to: { chest_type: 'inventory', chest: 0, slot: 48 },
      count: 3
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 7 },
      to: { chest_type: 'inventory', chest: 0, slot: 49 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 8 },
      to: { chest_type: 'inventory', chest: 0, slot: 50 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 9 },
      to: { chest_type: 'inventory', chest: 0, slot: 51 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 10 },
      to: { chest_type: 'inventory', chest: 0, slot: 52 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 11 },
      to: { chest_type: 'inventory', chest: 0, slot: 53 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 12 },
      to: { chest_type: 'inventory', chest: 1, slot: 2 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 13 },
      to: { chest_type: 'inventory', chest: 1, slot: 3 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 14 },
      to: { chest_type: 'inventory', chest: 1, slot: 4 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 15 },
      to: { chest_type: 'inventory', chest: 1, slot: 5 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 16 },
      to: { chest_type: 'inventory', chest: 1, slot: 6 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 17 },
      to: { chest_type: 'inventory', chest: 1, slot: 7 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 18 },
      to: { chest_type: 'inventory', chest: 1, slot: 8 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 19 },
      to: { chest_type: 'inventory', chest: 1, slot: 9 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 20 },
      to: { chest_type: 'inventory', chest: 1, slot: 10 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 21 },
      to: { chest_type: 'inventory', chest: 1, slot: 11 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 22 },
      to: { chest_type: 'inventory', chest: 1, slot: 12 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 23 },
      to: { chest_type: 'inventory', chest: 1, slot: 13 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 24 },
      to: { chest_type: 'inventory', chest: 1, slot: 14 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 25 },
      to: { chest_type: 'inventory', chest: 1, slot: 15 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 26 },
      to: { chest_type: 'inventory', chest: 1, slot: 16 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 27 },
      to: { chest_type: 'inventory', chest: 1, slot: 17 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 28 },
      to: { chest_type: 'inventory', chest: 1, slot: 18 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 29 },
      to: { chest_type: 'inventory', chest: 1, slot: 19 },
      count: 1
    },
    {
      from: { chest_type: 'station', chest: 2, slot: 30 },
      to: { chest_type: 'inventory', chest: 1, slot: 20 },
      count: 1
    }
  ]