require('dotenv').config()

import { Request, Response } from "express"

import { init_tables } from './db'
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
    const items = await inventory.list()
    res.send(items)
  })

  app.post('/api/order', async function (req: Request, res: Response) {
    await inventory.withdraw(req.body, 0)
  })

  app.post('/api/deposit', async function (req: Request, res: Response) {
    await inventory.deposit(req.body['station'])
  })

  app.post('/api/quote', async function (req: Request, res: Response) {
    const quote = await inventory.quote(req.body['station'])
    res.send(quote)
  })

  if (process.argv.length > 2) {
    if (process.argv[2] == "inventory") {
      await new Promise(r => setTimeout(r, 7000));
      await inventory.inventory()
    }
  } 

  if (process.argv.length > 2) {
    if (process.argv[2] == "init") {
      await new Promise(r => setTimeout(r, 7000));
      await init_tables()
    }
  } 

  app.listen(8000)


}

main()