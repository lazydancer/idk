import { Pool } from "pg";
const pool = new Pool({
    host: "localhost",
    user: "mc-inventory",
    database: "mc-inventory",
    password: "pineapple",
    port: 5432
})

import * as types from './types'

export async function get_items(): Promise<any> {
    try {
        const a = await pool.query("SELECT * FROM locations")
        return a["rows"]
    } catch(err) {
        console.log(err)
    }
} 

// Group items for total counts
export async function get_summary(): Promise<any> {
    try {
        const a = await pool.query("SELECT metadata, nbt, name, MAX(display_name) as display_name, SUM(count) as count FROM locations GROUP BY metadata, nbt, name")
        return a["rows"].filter( (x: any) => !x.name.endsWith("shulker_box"))   
    } catch(err) {
        console.log(err)
    }
} 

export async function insert(items: any): Promise<any> {

    for (const item of items) {
        await pool.query("INSERT INTO locations (metadata, name, display_name, stack_size, slot, count, nbt, chest, shulker_slot) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [item.metadata, item.name, item.display_name, item.stack_size, item.slot, item.count, item.nbt, item.chest, item.shulker_slot])
    }

}

export async function apply_moves(moves: any): Promise<any> {

    for (const move of moves) {

        // Move items from        
        if ( move.from.chest_type == types.ChestType.Inventory ) {
            console.log("move items from", move)

            if (move.from.shulker_slot == null) {
                await pool.query("UPDATE locations SET count = count - $1 WHERE slot=$2 and chest=$3 and shulker_slot is null",
                [move.count, move.from.slot, move.from.chest])
            } else {
                await pool.query("UPDATE locations SET count = count - $1 WHERE slot=$2 and chest=$3 and shulker_slot=$4",
                [move.count, move.from.slot, move.from.chest, move.from.shulker_slot])
            }
        }
        await pool.query("DELETE FROM locations WHERE count = 0")

        // Add items to
        if ( move.to.chest_type == types.ChestType.Inventory) {
            let exists = await pool.query("SELECT * FROM locations WHERE slot=$1 and chest=$2 and shulker_slot=$3",  [move.to.slot, move.to.chest, move.to.shulker_slot]) 
            
            if (exists.rowCount > 0) {
                await pool.query("UPDATE locations SET count = count + $1 WHERE slot=$2 and chest=$3 and shulker_slot=$4", [move.count, move.to.slot, move.to.chest, move.to.shulker_slot])        
            } else {
                await pool.query("INSERT INTO locations (metadata, name, display_name, stack_size, slot, count, nbt, chest, shulker_slot) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [move.item.metadata, move.item.name, move.item.display_name, move.item.stack_size, move.to.slot, move.item.count, move.item.nbt, move.to.chest, move.to.shulker_slot])

            }


        }

        // Log change


    }


}


