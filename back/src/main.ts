import { Request, Response } from "express"

import { getSummary } from './db'
import { Player } from './player';

const express = require('express')
var cors = require('cors')
const app = express()


app.use(cors())

app.get('/api/list', async function (req: Request, res: Response) {
  const items = await getSummary()
  res.send(items)
})

const p = new Player();

app.listen(8000)