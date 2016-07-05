
'use strict'

const _ = require('lodash')
const mongodb = require('mongodb')
const co = require('co')
const assert = require('assert')
const google = require('googleapis')
const cognate = require('cognate')
const Xray = require('x-ray')
const config = require('../config')

const msgDefaults = {
  response_type: 'in_channel',
  username: 'Drink Up!',
  icon_emoji: config('ICON_EMOJI')
}

var customsearch = google.customsearch('v1');

function parseString(str) {
  var re = /(?:")([^"]+)(?:")|([^\s"]+)(?=\s+|$)/g;
  var res=[], arr=null;
  while (arr = re.exec(str)) { res.push(arr[1] ? arr[1] : arr[0]); }
  return res;
}



const handler = (payload, res) => {

  var arr = parseString(cognate.replace(payload.text)) || [];

  customsearch.cse.list({ cx: config('GOOGLE_CSE_CX'), q: arr[2], auth: config('GOOGLE_API_KEY') }, (err, resp) => {
    if (err) {
      return console.log('An error occured', err);
    }

    let attachments = [];
    var xray = Xray();
    var abvs = "";

    // xray(resp.items[0].link, 'div#ba-content div:nth-child(3) div:nth-child(1)')(function(err, text) {
    xray(resp.items[0].link, 'div#ba-content')(function(err, text) {
      var abvarr = text.match(/Alcohol by volume \(ABV\)\:(.*)%/);
      var style = text.match(/Style\:(.*)Alcohol/);
      console.log(text);
      console.log(abvarr[1]);
      console.log(style[1]);
      abvs = abvarr[1].toString();

      var beers = [];
      beers[0] = {
        tap: arr[1],
        name: arr[2],
        url: resp.items[0].link || "",
        abv: abvs || arr[3],
        size: arr[4] || 5
      };

      co(function*() {
        var db = yield mongodb.MongoClient.connect(config('MONGODB_URI'));
        var r = yield db.collection('beers').insertOne(beers[0]);
        assert.equal(1, r.insertedCount);
        db.close();
      }).catch(function(err) {
        console.log(err.stack);
      });

      // console.log(beers[0]);
      // attachments[0].text = JSON.stringify(beer, null, 4)
      attachments = beers.map((beer) => {
        return {
          pretext: "Tapping keg...",
          title: `${beer.name}`,
          title_link: `${beer.url}`,
          text: `• ABV ${beer.abv}%  • 🍺 #${beer.tap}`,
          mrkdwn_in: ['text', 'pretext']
        }
      })

      let msg = _.defaults({
        channel: payload.channel_name,
        attachments: attachments
      }, msgDefaults)

      res.set('content-type', 'application/json')
      res.status(200).json(msg)
      return
    })

  });


}

module.exports = { pattern: /set/ig, handler: handler }
