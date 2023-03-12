import { Request, Response } from "express"

import { get_summary } from './db'
import { Player } from './player'

import * as inventory from './inventory'

const express = require('express')
var cors = require('cors')
const app = express()

/// Player only used in actions but defined globally to ensure stays running
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
    await inventory.withdraw(req.body, 0)
  })

  app.post('/api/deposit', async function (req: Request, res: Response) {
    console.log(req.body)
    await inventory.deposit(req.body['station'])
  })


  if (process.argv.length > 2) {
    if (process.argv[2] == "inventory") {
      await new Promise(r => setTimeout(r, 7000));
      await inventory.inventory()
    }
  } 

  app.listen(8000)


}

main()