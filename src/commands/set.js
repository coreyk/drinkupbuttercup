'use strict'

const _ = require('lodash')
const mongodb = require('mongodb')
const co = require('co')
const assert = require('assert')
const google = require('googleapis')
const cognate = require('cognate')
const scraperjs = require('scraperjs')
const toUnicode = require('to-unicode')
const config = require('../config')

const msgDefaults = {
  response_type: 'ephemeral',
  username: 'Drink Up!',
  icon_emoji: config('ICON_EMOJI')
}

var customsearch = google.customsearch('v1');

function parseString(str) {
  var re = /(?:")([^"]+)(?:")|([^\s"]+)(?=\s+|$)/g;
  var res = [],
    arr = null;
  while (arr = re.exec(str)) {
    res.push(arr[1] ? arr[1] : arr[0]);
  }
  return res;
}

const handler = (payload, res) => {

  var arr = parseString(cognate.replace(payload.text)) || [];

  customsearch.cse.list({
    cx: config('GOOGLE_CSE_CX'),
    q: arr[2],
    auth: config('GOOGLE_API_KEY')
  }, (err, resp) => {
    if (err) {
      return console.log('An error occured', err);
    }

    let attachments = [];

    scraperjs.StaticScraper.create(resp.items[0].link)
      .scrape(function($) {
        return $("#ba-content > div:nth-child(5)").map(function() {
          return $(this).text();
        }).get();
      })
      .then(function(htmlsrc) {
        var abvarr = htmlsrc[0].match(/Alcohol by volume \(ABV\)\:(.*)%/);
        var stylearr = htmlsrc[0].match(/Style\:(.*)[\n\r]/);
        var bascorearr = htmlsrc[0].match(/BA SCORE\s+(\d{2,3})[\n\r\t]/);

        var beers = [];
        beers[0] = {
          tap: arr[1],
          name: arr[2],
          url: resp.items[0].link || "",
          abv: abvarr[1].trim() || arr[3],
          style: stylearr[1].trim() || arr[4],
          score: bascorearr[1].trim() || arr[5],
          size: arr[6] || 5
        };

        co(function*() {
          var db = yield mongodb.MongoClient.connect(config('MONGODB_URI'));
          var r = yield db.collection('beers').insertOne(beers[0]);
          assert.equal(1, r.insertedCount);
          db.close();
        }).catch(function(err) {
          console.log(err.stack);
        });

        attachments = beers.map((beer) => {
          return {
            pretext: "Tapping keg...",
            title: `${beer.name}`,
            title_link: `${beer.url}`,
            color: '#2FA44F',
            text: `${toUnicode(beer.tap, 'circled')}  ABV ${beer.abv}%  •  ${beer.style}\n  •  BA Score✨ ${beer.score}/100  •  🍺`,
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

module.exports = {
  pattern: /set/ig,
  handler: handler
}
