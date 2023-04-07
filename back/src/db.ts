import { Pool } from "pg";
const pool = new Pool({
    host: "localhost",
    user: "mc-inventory",
    database: "mc-inventory",
    password: process.env['DB_PASS'],
    port: 5432
})

import * as types from './types'


function init_tables() {
    pool.query("CREATE TABLE IF NOT EXISTS items (id SERIAL PRIMARY KEY, metadata INTEGER, name TEXT, display_name TEXT, stack_size INTEGER, nbt JSONB)")
    pool.query("CREATE TABLE IF NOT EXISTS locations (item_id INTEGER, slot INTEGER, count INTEGER, chest INTEGER, shulker_slot INTEGER, FOREIGN KEY (item_id) REFERENCES items(id))")
    pool.query("CREATE TABLE IF NOT EXISTS inventory_history (id SERIAL PRIMARY KEY, item_id INTEGER REFERENCES items(id), user_id INTEGER, count INTEGER, event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
}

export async function get_items(): Promise<types.ItemLocation[]> {
    try {
        const request = await pool.query("SELECT * FROM locations JOIN items ON locations.item_id = items.id")

        return request["rows"].map( x => (
            {
                item: {
                    id: x.item_id,
                    name: x.name,
                    metadata: x.metadata,
                    nbt: x.nbt,
                    display_name: x.display_name,
                    stack_size: x.stack_size,
                },

                location: {
                    chest_type: types.ChestType.Inventory,
                    chest: x.chest,
                    slot: x.slot,
                    shulker_slot: x.shulker_slot,
                },

                count: x.count,
            }   
        ))

    } catch(err) {
        throw(err)
    }
} 

// Group items for total counts
export async function get_summary(): Promise<{item: types.Item, count: number}[]> {
    try {
        const request = await pool.query(`SELECT metadata, nbt, name, MAX(display_name) as display_name, MAX(stack_size) as stack_size, SUM(count) as count 
                                          FROM locations 
                                          JOIN items ON locations.item_id = items.id 
                                          GROUP BY metadata, nbt, name`)

        return request["rows"].filter( (x: any) => !x.name.endsWith("shulker_box")).map( x => (
            {
                item: {
                    id: x.item_id,
                    name: x.name,
                    metadata: x.metadata,
                    nbt: x.nbt,
                    display_name: x.display_name,
                    stack_size: x.stack_size,
                },
                count: x.count,
            }
        ))

    } catch(err) {
        throw(err)
    }
} 

export async function get_item_ids(items: types.ItemLocation[]) {

    for (const item of items) {

        // remove nbt data for shulker boxes, plaved back but not in the database
        let nbt_hold = null
        if (item.item.name.endsWith("shulker_box")) {
            nbt_hold = item.item.nbt
            item.item.nbt = null
        }

        let exists 
        if (item.item.nbt != null) {
            exists = await pool.query("SELECT * FROM items WHERE name=$1 and metadata=$2 and nbt=$3", [item.item.name, item.item.metadata, item.item.nbt])
        } else {
            exists = await pool.query("SELECT * FROM items WHERE name=$1 and metadata=$2 and nbt is null", [item.item.name, item.item.metadata])
        }

        if (exists.rowCount === 0) {
            const newItemResult = await pool.query("INSERT INTO items (metadata, name, display_name, stack_size, nbt) VALUES ($1, $2, $3, $4, $5) RETURNING id", [item.item.metadata, item.item.name, item.item.display_name, item.item.stack_size, item.item.nbt])
            item.item.id = newItemResult.rows[0].id
        } else {
            item.item.id = exists.rows[0].id
        }

        // restore nbt data for shulker boxes
        if (item.item.name.endsWith("shulker_box")) {
            item.item.nbt = nbt_hold
        }
    }



}
export async function apply_moves(moves: {item: types.Item, from: types.Location, to: types.Location, count: number}[]): Promise<any> {

    for (const move of moves) {

        // Move items from        
        if ( move.from.chest_type == types.ChestType.Inventory ) {
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
            let exists
            if (move.to.shulker_slot == null) {
                exists = await pool.query("SELECT * FROM locations WHERE slot=$1 and chest=$2 and shulker_slot is null",  [move.to.slot, move.to.chest]) 
            } else {
                exists = await pool.query("SELECT * FROM locations WHERE slot=$1 and chest=$2 and shulker_slot=$3",  [move.to.slot, move.to.chest, move.to.shulker_slot]) 

            }
            
            if (exists.rowCount > 0) {
                if (move.to.shulker_slot == null) {
                    await pool.query("UPDATE locations SET count = count + $1 WHERE slot=$2 and chest=$3 and shulker_slot is null", [move.count, move.to.slot, move.to.chest])        
                } else {
                    await pool.query("UPDATE locations SET count = count + $1 WHERE slot=$2 and chest=$3 and shulker_slot=$4", [move.count, move.to.slot, move.to.chest, move.to.shulker_slot])        
                }
            } else {
                await pool.query("INSERT INTO locations (item_id, slot, count, chest, shulker_slot) VALUES ($1, $2, $3, $4, $5)", [move.item.id, move.to.slot, move.count, move.to.chest, move.to.shulker_slot])
            }


        }

        // Log change
        if ( move.from.chest_type == types.ChestType.Inventory ) {
            await pool.query("INSERT INTO inventory_history (item_id, user_id, count) VALUES ($1, $2, $3)", [move.item.id, 1, -move.count])
        }

        if ( move.to.chest_type == types.ChestType.Inventory ) {
            await pool.query("INSERT INTO inventory_history (item_id, user_id, count) VALUES ($1, $2, $3)", [move.item.id, 1, move.count])
        }

    }


}


