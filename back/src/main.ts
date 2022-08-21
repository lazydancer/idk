import { Request, Response } from "express"

import { getSummary } from './db'


const express = require('express')
var cors = require('cors')
const app = express()


async function main() {

  app.use(cors())

  app.get('/api/list', async function (req: Request, res: Response) {
    const items = await getSummary()
    res.send(items)
  })

  const p = new Player();

  await new Promise(r => setTimeout(r, 5000));

  await p.open("", 20)

  app.listen(8000)

}

main()