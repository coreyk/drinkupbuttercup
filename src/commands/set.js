
'use strict'

const _ = require('lodash')
const google = require('googleapis')
const config = require('../config')

const msgDefaults = {
  response_type: 'in_channel',
  username: 'Drink Up!',
  icon_emoji: config('ICON_EMOJI')
}

var customsearch = google.customsearch('v1');

var searchit = (query, cb) => {
  if (query) {
    customsearch.cse.list({ cx: config('GOOGLE_CSE_CX'), q: query, auth: config('GOOGLE_API_KEY') }, function (err, resp) {
      if (err) {
        return console.log('An error occured', err);
      }
      // Got the response from custom search
      console.log('Result: ' + resp.searchInformation.formattedTotalResults);
      if (resp.items && resp.items.length > 0) {
        console.log('First result name is ' + resp.items[0].title);
      }
      return resp.items[0].link
      // process.nextTick(cb(resp.items[0]))
    });
  }
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

let attachments = [{
  title: `setting things`,
  text: `• ABV   • Tap `,
  mrkdwn_in: ['text', 'pretext']
}]

const handler = (payload, res) => {
  console.log(payload);
  let msg = _.defaults({
    channel: payload.channel_name,
    attachments: attachments
  }, msgDefaults)

  res.set('content-type', 'application/json')
  res.status(200).json(msg)
  return
}

module.exports = { pattern: /set/ig, handler: handler }
