require('dotenv').config()

import { Request, Response } from "express"

import { init_tables } from './db'
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
  worker.work()
  
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
  })

  app.post('/api/quote', async function (req: Request, res: Response) {
    const quote = await inventory.quote(req.body['station'], false)
    res.sendStatus(quote)
  })

  app.post('/api/deposit', async function (req: Request, res: Response) {
    await inventory.quote(req.body['station'], true)
  })



  if (process.argv.length > 2) {
    if (process.argv[2] == "init") {
      await init_tables()
    }
  } 

  app.listen(8000)


}

main()