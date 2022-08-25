import { Request, Response } from "express"

import { get_summary } from './db'
import { Player } from './player'

import * as inventory from './inventory'

const express = require('express')
var cors = require('cors')
const app = express()

declare global {
  var player: any;
}

global.player = new Player()

async function main() {

  app.use(cors())
  app.use(express.json())

  app.get('/api/list', async function (req: Request, res: Response) {
    const items = await get_summary()
    res.send(items)
  })

  app.post('/api/order', async function (req: Request, res: Response) {
    console.log(req.body)
    inventory.withdraw(req.body, 0)
  })

  app.post('/api/deposit', async function (req: Request, res: Response) {
    console.log(req.body)
    inventory.deposit(req.body['station'])
  })

  // Take Inventory
  // await new Promise(r => setTimeout(r, 5000));
  // inventory.inventory()

  app.listen(8000)


}

main()