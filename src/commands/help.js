
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
    title: 'Drinking alone:',
    color: '#2FA44F',
    text: '`/beer` shows what\'s on tap only to you',
    mrkdwn_in: ['text']
  },
  {
    title: 'Drinking socially:',
    color: '#fdd350',
    text: '`/beer all` shows everyone in the channel what\'s on tap',
    mrkdwn_in: ['text']
  },
  {
    title: 'Tap a keg:',
    color: '#b94545',
    text: '``/beer set` for more info',
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
