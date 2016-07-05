
'use strict'

const _ = require('lodash')
const mongodb = require('mongodb')
const co = require('co')
const assert = require('assert')
const toUnicode = require('to-unicode')
const config = require('../config')

const msgDefaults = {
  response_type: 'in_channel',
  username: 'Drink Up!',
  icon_emoji: config('ICON_EMOJI')
}

const handler = (payload, res) => {

  let attachments = []

  co(function*() {
    var db = yield mongodb.MongoClient.connect(config('MONGODB_URI'));
    console.log("Connected correctly to server");

    let col = db.collection('beers');

    let taps = [1, 2, 3, 4];
    let beers = [];

    for (var i = 0; i < taps.length; i++) {
      var r = yield col.find({tap: taps[i].toString()}).limit(1).sort({_id: -1}).toArray();
      console.log(r);
      beers.push(r[0]);
    }

    attachments = beers.map((beer) => {
      return {
        title: `${beer.name}`,
        title_link: `${beer.url}`,
        text: `🍺 ${toUnicode(beer.tap, 'circled')} • ABV ${beer.abv}% • Style: ${beer.style}`,
        mrkdwn_in: ['text', 'pretext']
      }
    })

    db.close();

    let msg = _.defaults({
      channel: payload.channel_name,
      attachments: attachments
    }, msgDefaults)

    res.set('content-type', 'application/json')
    res.status(200).json(msg)
    return

  }).catch(function(err) {
    console.log(err.stack);
  });
}

module.exports = { pattern: /info/ig, handler: handler }
