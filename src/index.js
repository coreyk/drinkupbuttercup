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
    forwardPath: (req, res) => {
      return require('url').parse(req.url).path
    }
  }))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

let db;

co(function*() {
  db = yield mongodb.MongoClient.connect(config('MONGODB_URI'));

  console.log("Database connection ready");

  app.listen(config('PORT'), (err) => {
    if (err) throw err

    console.log(`\n🍻  Beer is flowing on PORT ${config('PORT')} 🍻`)

    if (config('SLACK_TOKEN')) {
      console.log(`🤖  glug glug: drinking in real-time\n`)
      bot.listen({
        token: config('SLACK_TOKEN')
      })
    }
  })

  db.close();
}).catch(function(err) {
  console.log(err.stack);
});

app.get('/', (req, res) => {
  res.send('\n 👋 🌍 \n')
})

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
  co(function*() {
    var db = yield mongodb.MongoClient.connect(config('MONGODB_URI'));
    console.log("Connected correctly to server");

    let col = db.collection('beers');

    let taps = [1, 2, 3, 4];
    let beers = [];

    for (var i = 0; i < taps.length; i++) {
      var r = yield col.find({
        tap: taps[i].toString()
      }).limit(1).sort({
        _id: -1
      }).toArray();
      assert.equal(1, r.length);
      beers.push(r[0]);
    }

    db.close();
    // res.set('content-type', 'application/json')
    // res.status(200).json(beers)
    res.send(JSON.stringify(beers));
  }).catch(function(err) {
    console.log(err.stack);
  });
})
