
'use strict'

const _ = require('lodash')
const mongodb = require('mongodb')
const co = require('co')
const assert = require('assert')
const config = require('../config')

const msgDefaults = {
  response_type: 'in_channel',
  username: 'Drink Up!',
  icon_emoji: config('ICON_EMOJI')
}

const handler = (payload, res) => {
  co(function*() {
    var db = yield mongodb.MongoClient.connect(config('MONGODB_URI'));
    console.log("Connected correctly to server");

    var col = db.collection('beers');

    var taps = [1, 2];
    var beers = [];
    taps.forEach((tap) => {
      var beer = yield col.find({tap: tap}).limit(1).sort({_id: -1});
      assert.equal(1, beer.length);
      beers.push(beer);
    })

    let attachments = beers.map((beer) => {
      return {
        title: `${beer.name}`,
        title_link: `${beer.url}`,
        text: `• ABV ${beer.abv}%  • Tap ${beer.tap}`,
        mrkdwn_in: ['text', 'pretext']
      }
    })

    db.close();
  }).catch(function(err) {
    console.log(err.stack);
  });

  let msg = _.defaults({
    channel: payload.channel_name,
    attachments: attachments
  }, msgDefaults)

  res.set('content-type', 'application/json')
  res.status(200).json(msg)
  return
}

module.exports = { pattern: /info/ig, handler: handler }
