require('dotenv').config()

import { NextFunction, Request, Response } from "express"

import { Worker } from './worker'


import * as inventory from './inventory'
import * as db from './db'
import { daily_cumulative } from './item'

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

  // each request must have a token
  app.use(authenticate)

  app.post('/api/login', async function (req: AuthenticatedRequest, res: Response) {
    res.send({user: req.name, token: req.token, station_id: req.station_id})
  })

  app.get('/api/list', async function (req: AuthenticatedRequest, res: Response) {
    const items = await inventory.list()
    res.send(items)
  })

  app.get('/api/item/:item_id', async function (req: AuthenticatedRequest, res: Response) {
    const items = await inventory.list()
    const item = items.find( (x:any) => x.item.id == req.params.item_id)
    
    if( item == undefined ) { 
      res.send({error: "Item not found"})
      return
    }
    
    let history = await db.get_item_history(item.item.id)
    history = daily_cumulative(history)

    const result = {
      item: item.item,
      count: item.count,
      history: history,
    }

    res.send(result)
  })

  app.get('/api/station', async function (req: AuthenticatedRequest, res: Response) {
    const station_id = await db.get_open_station(req.user_id)
    res.send({station_id})
  })

  app.post('/api/withdraw', async function (req: AuthenticatedRequest, res: Response) {
    await inventory.withdraw(req.body, 0)
    res.send({'status': 'ok'})
  })

  app.post('/api/deposit', async function (req: AuthenticatedRequest, res: Response) {
    await inventory.quote(req.body['station'], true)
    res.send({'status': 'ok'})
  })

  if (process.argv.length > 2) {
    if (process.argv[2] == "inventory") {
      await inventory.take_inventory()
    }
    if (process.argv[2] == "init") {
      await db.init_tables()
    }
  } 

  app.listen(8000)


}

// adds the user id and token to the request
interface AuthenticatedRequest extends Request {
  user_id: number
  token: string
  name: string
  station_id: number
}

const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).send({ error: 'No credentials sent!' });
  }

  const user = await db.verify(token)

  console.log(user, "user")

  if (!user) {
    return res.status(401).send({ error: 'Invalid credentials!' });
  }

  req.user_id = user.id
  req.token = user.token
  req.name = user.name
  req.station_id = user.station_id

  next()
}


main()