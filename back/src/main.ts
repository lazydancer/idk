require('dotenv').config()

import { NextFunction, Request, Response } from "express"

import { Worker } from './worker'

import * as inventory from './inventory'
import * as db from './db'

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
    console.log("login request", req.body)
    res.send({userId: req.userId, token: req.token})
  })

  app.get('/api/list', async function (req: AuthenticatedRequest, res: Response) {
    const items = await inventory.list()
    res.send(items)
  })

  app.get('/api/item/:item_id', async function (req: AuthenticatedRequest, res: Response) {
    const items = await inventory.list()
    const item = items.find( (x:any) => x.item.id == req.params.item_id)
    res.send(item)
  })

  app.get('/api/station', async function (req: AuthenticatedRequest, res: Response) {
    const userId = parseInt(req.query.userId as string, 10)
    const station = await db.get_open_station(userId)
    res.send(station)
  })

  app.post('/api/order', async function (req: AuthenticatedRequest, res: Response) {
    await inventory.withdraw(req.body, 0)
    res.send({'status': 'ok'})
  })

  app.get('/api/quote/:station', async function (req: AuthenticatedRequest, res: Response) {
    const job_id = await inventory.quote(parseInt(req.params.station), false)
    res.send({'job_id': job_id})
  })

  app.get('/api/survey/:job_id', async function (req: AuthenticatedRequest, res: Response) {
    const quote = await inventory.get_survey(parseInt(req.params.job_id))
    res.send(quote)
  })

  app.get('/api/job/:job_id', async function (req: AuthenticatedRequest, res: Response) {
    const job = await db.get_job(parseInt(req.params.job_id))
    res.send(job)
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
  userId: number
  token: string
}

const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization

  console.log("reciegvied token", token)

  if (!token) {
    return res.status(401).send({ error: 'No credentials sent!' });
  }

  const user = await db.verify(token)

  console.log("verify token", user)


  if (!user) {
    return res.status(401).send({ error: 'Invalid credentials!' });
  }

  req.userId = user.userId
  req.token = user.token

  next()
}


main()