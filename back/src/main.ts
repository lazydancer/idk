import { Request, Response } from "express"

import {connectToDB} from './db'

const express = require('express')
var cors = require('cors')
const app = express()


app.use(cors())

app.get('/api/list', function (req: Request, res: Response) {
  res.send('Hello World')
})

function sum (num1: number, num2: number){
  return num1 + num2;
}
console.log(sum(8,4))

connectToDB()

app.listen(8000)