import { Pool } from "pg";
const pool = new Pool({
    host: "localhost",
    user: "mc-inventory",
    database: "mc-inventory",
    password: "pineapple",
    port: 5432
})

export const connectToDB = () => {
    try {
        pool.connect()
        pool.query("SELECT * FROM items", (err: any, res: any) => {
            console.log(res)
        })
    } catch(err) {
        console.log(err)
    }
}
