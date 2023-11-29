import { Pool } from "pg";
import { load_config } from "../types/config";
import * as types from '../types/types'

const config = load_config()

const pool = new Pool({
    host: config.database.host,
    user: config.database.user,
    database: config.database.database,
    password: config.database.password,
    port: config.database.port,
})

const STATIONS_COUNT = config.build.stations


export async function init_tables() {
    await pool.query("CREATE TABLE IF NOT EXISTS items (id SERIAL PRIMARY KEY, metadata INTEGER, name TEXT, display_name TEXT, stack_size INTEGER, nbt JSONB)")
    await pool.query("CREATE TABLE IF NOT EXISTS locations (item_id INTEGER, slot INTEGER, count INTEGER, chest INTEGER, shulker_slot INTEGER, FOREIGN KEY (item_id) REFERENCES items(id))")
    await pool.query("CREATE TABLE IF NOT EXISTS inventory_history (id SERIAL PRIMARY KEY, item_id INTEGER REFERENCES items(id), user_id INTEGER, count INTEGER, event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    await pool.query("CREATE TABLE IF NOT EXISTS queue (id serial4 NOT NULL, \"type\" text NOT NULL, parameters jsonb NULL, status text NOT NULL DEFAULT 'queued'::text, created_at timestamp NOT NULL DEFAULT now(), started_at timestamp NULL, completed_at timestamp NULL, CONSTRAINT queue_pkey PRIMARY KEY (id))")
    await pool.query("CREATE TABLE IF NOT EXISTS surveyed (slot int4, count int4, chest int4, shulker_slot int4, item_id int4, \"date\" timestamp DEFAULT now(), chest_type int4, job_id int4)")
    await pool.query("CREATE TABLE IF NOT EXISTS users (id serial4, \"name\" varchar(255), token varchar, station_id int4 NULL, CONSTRAINT users_pkey PRIMARY KEY (id));")
    await pool.query("CREATE TABLE IF NOT EXISTS ownership (user_id int4 NULL, item_id int4 NULL, count int4 NULL, state varchar NULL);")

    console.log("Tables initialized")
}

export async function get_item_info(item_id: number): Promise<types.Item> {
    try {
        const request = await pool.query("SELECT * FROM items WHERE id = $1", [item_id])
        return request["rows"][0]
    } catch(err) {
        throw(err)
    }
}

export async function get_inventory_items(): Promise<types.ItemLocation[]> {
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


export async function get_user_items(user_id: number): Promise<types.ItemCount[]> {
    try {
        const request = await pool.query(`SELECT * FROM ownership JOIN items ON ownership.item_id = items.id WHERE ownership.user_id = $1 AND ownership.status = 'Open'`, [user_id])

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
        const request = await pool.query(`SELECT item_id, metadata, nbt, name, MAX(display_name) as display_name, MAX(stack_size) as stack_size, SUM(count) as count 
                                          FROM locations 
                                          JOIN items ON locations.item_id = items.id 
                                          GROUP BY item_id, metadata, nbt, name`)


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

export async function get_item_ids(items: types.Item[]): Promise<void> {

    for (const item of items) {

        // remove nbt data for shulker boxes, placed back but not in the database
        let nbt_hold = null
        if (item.name.endsWith("shulker_box")) {
            nbt_hold = item.nbt
            item.nbt = null
        }

        let exists 
        if (item.nbt != null) {
            exists = await pool.query("SELECT * FROM items WHERE name=$1 and metadata=$2 and nbt=$3", [item.name, item.metadata, item.nbt])
        } else {
            exists = await pool.query("SELECT * FROM items WHERE name=$1 and metadata=$2 and nbt is null", [item.name, item.metadata])
        }

        if (exists.rowCount === 0) {
            const newItemResult = await pool.query("INSERT INTO items (metadata, name, display_name, stack_size, nbt) VALUES ($1, $2, $3, $4, $5) RETURNING id", [item.metadata, item.name, item.display_name, item.stack_size, item.nbt])
            item.id = newItemResult.rows[0].id
        } else {
            item.id = exists.rows[0].id
        }

        // restore nbt data for shulker boxes
        if (item.name.endsWith("shulker_box")) {
            item.nbt = nbt_hold
        }

    }


}

export async function get_item_history(item_id: number): Promise<{volume: number, date: Date}[]> {
        const history = await pool.query("SELECT * FROM inventory_history WHERE item_id=$1", [item_id])

        return history.rows.map( x => (
            {
                volume: parseInt(x.count, 10),
                date: new Date(x.event_date),
            }
        ))

}

export async function apply_moves(moves: types.MoveItem[]): Promise<any> {

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

export async function apply_ownership(user_id: number, moves: types.MoveItem[]): Promise<any> {
    // Start a transaction
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const move of moves) {
            await process_move(client, user_id, move);
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function process_move(client: any, user_id: number, move: types.MoveItem) {
    const ownership = await client.query(`SELECT * FROM ownership WHERE user_id = $1 AND item_id = $2 AND status = 'Open'`, [user_id, move.item.id])

    if (move.to.chest_type === types.ChestType.Inventory) { // Deposit
        if (ownership.rowCount > 0) {
            await client.query(`UPDATE ownership SET count = count + $1 WHERE user_id = $2 AND item_id = $3 AND status = 'Open'`, [move.count, user_id, move.item.id]);
        } else {
            await client.query(`INSERT INTO ownership (user_id, item_id, count, status) VALUES ($1, $2, $3, 'Open')`, [user_id, move.item.id, move.count]);
        }
    } else { // Withdraw
        if (ownership.rowCount > 0 && ownership.rows[0].count > move.count) {
            await client.query(`UPDATE ownership SET count = count - $1 WHERE user_id = $2 AND item_id = $3 AND status = 'Open'`, [move.count, user_id, move.item.id]);
        } else if ( ownership.rowCount > 0 && ownership.rows[0].count === move.count) {
            await client.query(`DELETE FROM ownership WHERE user_id = $1 AND item_id = $2 AND status = 'Open'`, [user_id, move.item.id]);
        } else {
            throw new Error('Ownership not found or insufficient count');
        }
    }

}


/*
Queue
*/

export async function get_queue(): Promise<types.Job[]> {
    const result = await pool.query("SELECT * FROM queue")
    return result.rows
}

export async function add_job(type: types.JobType, parameters: any): Promise<number> {
    const parameters_string = JSON.stringify(parameters)
    const result  = await pool.query("INSERT INTO queue (type, parameters) VALUES ($1, $2) RETURNING id", [type, parameters_string]) 
    const id = result.rows[0].id
    return id
}

export async function get_next_job(): Promise<types.Job> {
    const result = await pool.query(
        'SELECT * FROM queue WHERE status = $1 ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED',
        [types.JobStatus.Queued]
    );
    const job = result.rows[0];
    return job;
}

export async function get_job(id: any): Promise<types.Job> {
    const result = await pool.query("SELECT * FROM queue WHERE id = $1", [id])
    const job = result.rows[0]
    return job
}


export async function change_job_status(id: any, status: any): Promise<void> {
    switch (status) {
        case 'in_progress':
            await pool.query("UPDATE queue SET status = $1, started_at = $2 WHERE id = $3", [status, new Date(), id])
            break;
        case 'completed':
            await pool.query("UPDATE queue SET status = $1, completed_at = $2 WHERE id = $3", [status, new Date(), id])
            break;
        case 'failed':
            await pool.query("UPDATE queue SET status = $1 WHERE id = $2", [status, id])
            break;
    }
}

/*
Surveyed
*/

export async function add_survey(job_id: number, items: types.ItemLocation[]): Promise<void> {
    for( const item of items ) {
        await pool.query("INSERT INTO surveyed (job_id, item_id, chest_type, chest, slot, shulker_slot, count) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [job_id, item.item.id, item.location.chest_type, item.location.chest, item.location.slot, item.location.shulker_slot, item.count])    
    }
}

export async function get_survey(job_id: number): Promise<types.ItemLocation[]> {
    const result = await pool.query("SELECT item_id, name, metadata, nbt, display_name, stack_size, chest_type, chest, slot, shulker_slot, count FROM surveyed JOIN items ON surveyed.item_id = items.id WHERE job_id = $1", [job_id])

    return result.rows.map( (x: any) => (
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
                chest_type: x.chest_type,
                chest: x.chest,
                slot: x.slot,
                shulker_slot: x.shulker_slot,
            },

            count: x.count,
        }
    ))
}

/*
User management
*/

export async function verify(token: string): Promise<{id: number, station_id: number, token: string, name: string}> {
    const result = await pool.query("SELECT id, name, station_id, token FROM users WHERE token = $1", [token])
    const user = result.rows[0]
    return user
}

export async function get_open_station(user_id: number): Promise<number|null> {
    // get from user table, with columns id, name, token, station
    const result = await pool.query("SELECT id, station_id FROM users WHERE station_id IS NOT NULL")
    const locked_stations = result.rows

    console.log("locked_stations", locked_stations)
    // Return station if user already has one
    const user_result = locked_stations.find( (x: any) => x.id == user_id )
    if (user_result) {
        return user_result.station_id
    }

    let station_id = null
    // Find an open station
    for(let i=0; i<STATIONS_COUNT; i++) {
        if ( !locked_stations.map( x => x.station_id ).includes(i) ) {
            station_id = i
            break;
        }
    }

    if (station_id != null) {
        await pool.query("UPDATE users SET station_id = $1 WHERE id = $2", [station_id, user_id])
    }

    return station_id

}

export async function open_station(stationId: number): Promise<void> {
    await pool.query("UPDATE users SET station = NULL WHERE station_id = $1", [stationId])
}