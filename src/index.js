
'use strict'

const express = require('express')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser')
const _ = require('lodash')
const mongodb = require('mongodb')
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

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
let db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(config('MONGODB_URI'), (err, database) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");
  db.collectionNames(function(err, collections){
      console.log(collections);
  });

  // // Initialize the app.
  // var server = app.listen(process.env.PORT || 8080, function () {
  //   var port = server.address().port;
  //   console.log("App now running on port", port);
  // });

  app.listen(config('PORT'), (err) => {
    if (err) throw err

    console.log(`\n🍻  Beer is flowing on PORT ${config('PORT')} 🍻`)

    if (config('SLACK_TOKEN')) {
      console.log(`🤖  glug glug: drinking in real-time\n`)
      bot.listen({ token: config('SLACK_TOKEN') })
    }
  })
});

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
