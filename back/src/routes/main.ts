import { NextFunction, Request, Response } from "express"



import * as inventory from '../inventory/inventory'
import { take_inventory } from '../inventory/optimize'
import * as db from '../model/db'
import * as types from '../types/types'

const express = require('express')
var cors = require('cors')
const app = express()

export async function run_server() {
  app.use(cors())
  app.use(express.json())
  app.use(authenticate)

  app.post('/api/login', async function (req: AuthenticatedRequest, res: Response) {
    res.send({user: req.name, token: req.token, station_id: req.station_id})
  })

  app.get('/api/list', async function (req: AuthenticatedRequest, res: Response) {
    const items = await inventory.list(req.user_id)
    res.send(items)
  })

  app.get('/api/item/:item_id', async function (req: AuthenticatedRequest, res: Response) {
    const item = await inventory.item(parseInt(req.params.item_id,10), req.user_id)

    res.send(item)
  })

  app.get('/api/station', async function (req: AuthenticatedRequest, res: Response) {
    const station_id = await db.get_open_station(req.user_id)
    console.log("station_id", station_id)
    res.send({station_id})
  })

  app.post('/api/withdraw', async function (req: AuthenticatedRequest, res: Response) {
    console.log("req.body", req.body)
    const request = {
      station: req.station_id,
      items: req.body,
      user_id: req.user_id,
    }

    await db.add_job(types.JobType.Withdraw, request)
    res.send({'status': 'ok'})
  })

  app.post('/api/deposit', async function (req: AuthenticatedRequest, res: Response) {
    const request = {
      station_id: req.station_id,
      user_id: req.user_id,
    }

    await db.add_job(types.JobType.Deposit, request)
    res.send({'status': 'ok'})
  })

  app.post('/api/survey', async function (req: AuthenticatedRequest, res: Response) {
    const request = {
      chest_type: types.ChestType.Station,
      chest: req.station_id,
    }

    const id = await db.add_job(types.JobType.Survey, request)
    res.send({'status': 'ok', 'job_id': id})
  })

  app.get('/api/job/:job_id', async function (req: AuthenticatedRequest, res: Response) {

    const job = await db.get_job(parseInt(req.params.job_id,10))

    if (job.type === types.JobType.Survey && job.status === types.JobStatus.Completed) {
      const items = await inventory.get_survey(parseInt(req.params.job_id,10))
      res.send({job, items})
    } else {
      res.send({job})
    }

  })

  if (process.argv.length > 2) {
    if (process.argv[2] == "inventory") {
      await take_inventory()
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

  if (!user) {
    return res.status(401).send({ error: 'Invalid credentials!' });
  }

  req.user_id = user.id
  req.token = user.token
  req.name = user.name
  req.station_id = user.station_id

  next()
}