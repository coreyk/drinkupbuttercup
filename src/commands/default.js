'use strict'

const _ = require('lodash')
const mongodb = require('mongodb')
const co = require('co')
const assert = require('assert')
const toUnicode = require('to-unicode')
const helpers = require('../helpers/helpers')
const config = require('../config')

var msgDefaults = {
  response_type: 'ephemeral',
  username: 'Drink Up!',
  icon_emoji: config('ICON_EMOJI')
}

const handler = (payload, res) => {
  msgDefaults.response_type = payload.text.indexOf('all') !== -1 ? 'in_channel' : 'ephemeral';

  let attachments = []

  co(function*() {
    var db = yield mongodb.MongoClient.connect(config('MONGODB_URI'));
    console.log("Connected correctly to server");

    let col = db.collection('beers');

    let taps = [1, 2, 3, 4];
    let beers = [];

    for (var i = 0; i < taps.length; i++) {
      var r = yield col.find({
        tap: taps[i].toString()
      }).limit(1).sort({
        _id: -1
      }).toArray();
      assert.equal(1, r.length);
      beers.push(r[0]);
    }

    attachments = beers.map((beer) => {
      var abv = isBlank(beer.tap) ? "" : `  •  ABV ${beer.abv}%`;
      var style = isBlank(beer.style) ? "" : `  •  ${beer.style}`;
      var score = isBlank(beer.score) ? "" : `🏅 ${beer.score}/100`;
      var tap_date = isBlank(beer.tap_date) ? "" : `  •  Days on tap: ${helpers.daysOnTap(beer.tap_date)}`;
      return {
        title: `${beer.name}`,
        title_link: `${beer.url}`,
        color: '#fdd350',
        text: `${toUnicode(beer.tap, 'circled')}${abv}${style}\n${score}${tap_date}  •  🍺`,
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

module.exports = {
  pattern: /me/ig,
  handler: handler
}
