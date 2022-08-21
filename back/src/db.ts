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
