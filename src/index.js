
'use strict'

const express = require('express')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser')
const _ = require('lodash')
const mongodb = require('mongodb')
const co = require('co')
const assert = require('assert')
const config = require('./config')
const commands = require('./commands')
const helpCommand = require('./commands/help')
const defaultCommand = require('./commands/default')

let bot = require('./bot')

let app = express()

if (config('PROXY_URI')) {
  app.use(proxy(config('PROXY_URI'), {
    forwardPath: (req, res) => { return require('url').parse(req.url).path }
  }))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

let db;

co(function*() {
  db = yield mongodb.MongoClient.connect(config('MONGODB_URI'));

  console.log("Database connection ready");

  db.listCollections().toArray( (err, collections) => {
    console.log(collections);
  });

  app.listen(config('PORT'), (err) => {
    if (err) throw err

    console.log(`\n🍻  Beer is flowing on PORT ${config('PORT')} 🍻`)

    if (config('SLACK_TOKEN')) {
      console.log(`🤖  glug glug: drinking in real-time\n`)
      bot.listen({ token: config('SLACK_TOKEN') })
    }
  })

}).catch(function(err) {
  console.log(err.stack);
});

// mongodb.MongoClient.connect(config('MONGODB_URI'), (err, database) => {
//   if (err) {
//     console.log(err);
//     process.exit(1);
//   }
//
//   db = database;
//   console.log("Database connection ready");
//
//   app.listen(config('PORT'), (err) => {
//     if (err) throw err
//
//     console.log(`\n🍻  Beer is flowing on PORT ${config('PORT')} 🍻`)
//
//     if (config('SLACK_TOKEN')) {
//       console.log(`🤖  glug glug: drinking in real-time\n`)
//       bot.listen({ token: config('SLACK_TOKEN') })
//     }
//   })
// });

app.get('/', (req, res) => { res.send('\n 👋 🌍 \n') })

app.post('/commands/beer', (req, res) => {
  let payload = req.body

  if (!payload || payload.token !== config('APP_COMMAND_TOKEN')) {
    let err = '✋ An invalid slash token was provided\n' +
              '   Is your Slack slash token correctly configured?'
    console.log(err)
    res.status(401).end(err)
    return
  }

  let cmd = _.reduce(commands, (a, cmd) => {
    return payload.text.match(cmd.pattern) ? cmd : a
  }, defaultCommand)

  cmd.handler(payload, res)
})

app.get('/thirsty', (req, res) => {
  res.send('\n 👋 🌍 \n')
})
