const functions = require('firebase-functions')
const express   = require('express')
const cors      = require('cors')
const mqtt      = require('mqtt')
const { open }  = require('sqlite')
const sqlite3   = require('sqlite3')

const app = express()
app.use(cors(), express.json())

// 1) Conexão SQLite e seed (adapte caminhos se precisar)
const dbPromise = open({
  filename: './estoque.db',
  driver: sqlite3.Database
})

// 2) Criação de tabelas e seed — igual ao seu index.js
;(async () => {
  const db = await dbPromise
  // ... seu código de CREATE TABLE e seed ...
})()

// 3) Rotas CRUD
app.get('/produtos',      /* ... */)
app.post('/produtos',     /* ... */)
app.put('/produtos/:id',  /* ... */)
app.delete('/produtos/:id',/* ... */)

// 4) MQTT (se precisar)
const client = mqtt.connect(process.env.MQTT_BROKER_URL||'mqtt://broker.emqx.io')
client.on('connect', () => {/*...*/})
client.on('message', async (topic,msg) => {/*...*/})

// **IMPORTANTE**: não use app.listen()
// Em vez disso, exporte sua API como função HTTP:
exports.api = functions.https.onRequest(app)
