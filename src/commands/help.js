
'use strict'

const _ = require('lodash')
const config = require('../config')

const msgDefaults = {
  response_type: 'in_channel',
  username: 'Drink Up!',
  icon_emoji: config('ICON_EMOJI')
}

let attachments = [
  {
    title: 'Drink Up! shows what beers we have on tap',
    color: '#2FA44F',
    text: '`/beer tap #` returns just that tap\'s selection',
    mrkdwn_in: ['text']
  },
  {
    title: 'Configuring Drink Up!',
    color: '#E3E4E6',
    text: '`/beer help` ... you\'re lookin at it! \n',
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
