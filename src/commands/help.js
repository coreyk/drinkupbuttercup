
'use strict'

const _ = require('lodash')
const config = require('../config')

const msgDefaults = {
  response_type: 'ephemeral',
  username: 'Drink Up!',
  icon_emoji: config('ICON_EMOJI')
}

let attachments = [
  {
    title: 'Drink Up! shows what beers we have on tap',
    color: '#fdd350',
    text: '`/beer` shows what\'s on tap only to you',
    mrkdwn_in: ['text']
  },
  {
    title: 'Configuring Drink Up!',
    color: '#fdd350',
    text: '`/beer all` shows everyone what\'s on each tap \n',
    mrkdwn_in: ['text']
  }
]

const handler = (payload, res) => {
  let msg = _.defaults({
    channel: payload.channel_name,
    attachments: attachments
  }, msgDefaults)

  res.set('content-type', 'application/json')
  res.status(200).json(msg)
  return
}

module.exports = { pattern: /help/ig, handler: handler }
