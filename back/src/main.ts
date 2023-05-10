require('dotenv').config()

import { Request, Response } from "express"

import { init_tables, get_job, get_survey } from './db'
import { Worker } from './worker'

import * as inventory from './inventory'
import { verify } from "crypto"

const express = require('express')
var cors = require('cors')
const app = express()

// The inventory needs to select a slot to place items in. This is a global variable that is incremented each time a slot is used.
// It is so bad and I am sorry. I put this here so I will fix it first.
declare global {
  var openSlot : number
}
globalThis.openSlot = 0

async function main() {

  const worker = new Worker()
  // Give it 5 seconds to start up before it starts working
  setTimeout(() => worker.work(), 5000);
  
  app.use(cors())
  app.use(express.json())

  app.get('/api/list', async function (req: Request, res: Response) {
    const items = await inventory.list()
    res.send(items)
  })

  app.get('/api/item/:item_id', async function (req: Request, res: Response) {
    const items = await inventory.list()
    const item = items.find( (x:any) => x.item.id == req.params.item_id)
    res.send(item)
  })

  app.post('/api/order', async function (req: Request, res: Response) {
    await inventory.withdraw(req.body, 0)
    res.send({'status': 'ok'})
  })

  app.get('/api/quote/:station', async function (req: Request, res: Response) {
    const job_id = await inventory.quote(parseInt(req.params.station), false)
    res.send({'job_id': job_id})
  })

  app.get('/api/survey/:job_id', async function (req: Request, res: Response) {
    const quote = await inventory.get_survey(parseInt(req.params.job_id))
    res.send(quote)
  })

  app.get('/api/job/:job_id', async function (req: Request, res: Response) {
    const job = await get_job(parseInt(req.params.job_id))
    res.send(job)
  })

  app.post('/api/deposit', async function (req: Request, res: Response) {
    await inventory.quote(req.body['station'], true)
    res.send({'status': 'ok'})
  })

  if (process.argv.length > 2) {
    if (process.argv[2] == "inventory") {
      await inventory.take_inventory()
    }
    if (process.argv[2] == "init") {
      await init_tables()
    }
  } 

  app.listen(8000)


}

main()