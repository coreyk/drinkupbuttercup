
'use strict'

const _ = require('lodash')
const google = require('googleapis')
const config = require('../config')

google.resultsPerPage = 1

const msgDefaults = {
  response_type: 'in_channel',
  username: 'Drink Up!',
  icon_emoji: config('ICON_EMOJI')
}

var customsearch = google.customsearch('v1');
var searchit = customsearch.cse.list({ cx: config('GOOGLE_CSE_CX'), q: 'Other Half All Citra Everything', auth: config('GOOGLE_API_KEY') }, function (err, resp) {
  if (err) {
    return console.log('An error occured', err);
  }
  // Got the response from custom search
  console.log('Result: ' + resp.searchInformation.formattedTotalResults);
  if (resp.items && resp.items.length > 0) {
    console.log('First result name is ' + resp.items[0].title);
  }
  return resp.items[0].link
});

let attachments = [
  {
    title: 'Tap 1: Other Half All Citra Everything',
    title_link: searchit,
    color: '#2FA44F',
    text: '`/beer tap #` returns just that tap\'s selection',
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

module.exports = { pattern: /test/ig, handler: handler }
