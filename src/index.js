
'use strict'

const express = require('express')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser')
const _ = require('lodash')
const config = require('./config')
const commands = require('./commands')
const helpCommand = require('./commands/help')
const defaultCommant = require('./commands/default')

let bot = require('./bot')

let app = express()

if (config('PROXY_URI')) {
  app.use(proxy(config('PROXY_URI'), {
    forwardPath: (req, res) => { return require('url').parse(req.url).path }
  }))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

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

app.listen(config('PORT'), (err) => {
  if (err) throw err

  console.log(`\n🍻  Beer is flowing on PORT ${config('PORT')} 🍻`)

  if (config('SLACK_TOKEN')) {
    console.log(`🤖  glug glug: drinking in real-time\n`)
    bot.listen({ token: config('SLACK_TOKEN') })
  }
})
