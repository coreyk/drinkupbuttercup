
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
  let attachments = []

  co(function*() {
    var db = yield mongodb.MongoClient.connect(config('MONGODB_URI'));
    console.log("Connected correctly to server");

    let col = db.collection('beers');

    let taps = [1, 2];
    let beers = [];

    for (var i = 0; i < taps.length; i++) {
      var r = yield col.find({tap: taps[i]}).limit(1).sort({_id: -1});
      beers.push(r);
    }
    // var r = yield col.find({tap: 1}).limit(1).sort({_id: -1});



    // taps.forEach((tap) => {
    //   var r = yield col.find({tap: tap}).limit(1).sort({_id: -1});
    //   assert.equal(1, r.length);
    //   beers.push(r);
    // })

    // let beers = [
    //   {
    //     tap: 1,
    //     name: 'Other Half All Citra Everything IPA',
    //     url: 'http://www.beeradvocate.com/beer/profile/33510/220357/',
    //     abv: 8.5,
    //     size: 5
    //   },
    //   {
    //     tap: 2,
    //     name: 'Brooklyn Lager',
    //     url: 'http://www.beeradvocate.com/beer/profile/45/148/',
    //     abv: 5.2,
    //     size: 5
    //   }
    // ]

    attachments = beers.map((beer) => {
      return {
        title: `${beer.name}`,
        title_link: `${beer.url}`,
        text: `• ABV ${beer.abv}%  • Tap ${beer.tap}`,
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
