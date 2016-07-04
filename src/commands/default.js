
'use strict'

const _ = require('lodash')
const config = require('../config')

google.resultsPerPage = 1

const msgDefaults = {
  response_type: 'in_channel',
  username: 'Drink Up!',
  icon_emoji: config('ICON_EMOJI')
}

let beers = [
  {
    tap: 1,
    name: 'Other Half All Citra Everything IPA',
    url: 'http://www.beeradvocate.com/beer/profile/33510/220357/',
    abv: 8.5,
    size: 5
  },
  {
    tap: 2,
    name: 'Brooklyn Lager',
    url: 'http://www.beeradvocate.com/beer/profile/45/148/',
    abv: 5.2,
    size: 5
  },
  {
    tap: 3,
    name: 'Other Half Magic Green Nuggets IPA',
    url: '',
    abv: 9.3,
    size: 5
  },
  {
    tap: 4,
    name: 'Allagash White',
    url: 'http://www.beeradvocate.com/beer/profile/4/59/',
    abv: 5.1,
    size: 5
  }
]

let attachments = beers.slice(0, 4).map((beer) => {
  return {
    title: `${beer.name}`,
    title_link: `${beer.url}`,
    text: `• ABV ${beer.abv}%  • Tap ${beer.tap}`,
    mrkdwn_in: ['text', 'pretext']
  }
})

const handler = (payload, res) => {
  let msg = _.defaults({
    channel: payload.channel_name,
    attachments: attachments
  }, msgDefaults)

  res.set('content-type', 'application/json')
  res.status(200).json(msg)
  return
}

module.exports = { pattern: /info/ig, handler: handler }
