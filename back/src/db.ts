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
        await pool.query("UPDATE items SET count = $1 WHERE slot=$2 and chest=$3",
        [item.available - item.count, item.slot, item.chest])
    }

    await pool.query("DELETE FROM items WHERE count = 0")


}