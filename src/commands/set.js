'use strict'

const _ = require('lodash')
const mongodb = require('mongodb')
const co = require('co')
const assert = require('assert')
const google = require('googleapis')
const cognate = require('cognate')
const scraperjs = require('scraperjs')
const toUnicode = require('to-unicode')
const helpers = require('../helpers/helpers')
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

  if (payload.text.match(/^set \d+ empty ?(?=\d{4}-\d{2}-\d{2}|$)/)) {
    // Set empty keg

    var arr = cognate.replace(payload.text).match(/^set (\d+) (empty) ?(?=\d{4}-\d{2}-\d{2}|$)/) || [];
    var manual_date = payload.text.match(/^set \d empty (\d{4}-\d{2}-\d{2})$/) || [];
    var tap_date = typeof manual_date[1] !== 'undefined' ? Date.parse(manual_date[1]) : Date.now();

    let attachments = [];

    var beers = [];
    beers[0] = {
      tap: arr[1],
      name: "(Empty...)",
      url: "",
      abv: "",
      style: "",
      score: "",
      tap_date: tap_date,
      size: 0
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
        pretext: "Setting empty keg...",
        title: `${beer.name}`,
        title_link: `${beer.url}`,
        color: '#303030',
        text: `${toUnicode(beer.tap, 'circled')}`,
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

  } else if (payload.text.match(/^set \d+ .*$/)) {
    // TAP A KEG THE EASY WAY
    // /beer set 1 Tasty beer

    var arr = cognate.replace(payload.text).match(/^set (\d+) (.*?) ?(?=\d{4}-\d{2}-\d{2}|$)/) || [];
    var manual_date = payload.text.match(/^set \d .* (\d{4}-\d{2}-\d{2} \d{1,2}:\d{2})$/) || [];
    var tap_date = typeof manual_date[1] !== 'undefined' ? Date.parse(manual_date[1]) : Date.now();

    customsearch.cse.list({
      cx: config('GOOGLE_CSE_CX'),
      q: arr[2],
      auth: config('GOOGLE_API_KEY')
    }, (err, resp) => {
      if (err) {
        return console.log('An error occured', err);
      }

      let attachments = [];

      console.log(resp.items[0].link);

      scraperjs.StaticScraper.create(resp.items[0].link)
        .scrape(function($) {
          return $("#ba-content > div:nth-child(5)").map(function() {
            return $(this).text();
          }).get();
        })
        .then(function(htmlsrc) {
          if (typeof htmlsrc !== 'undefined') {

            var abvarr = htmlsrc[0].match(/Alcohol by volume \(ABV\)\:(.*)%/) || [];
            var stylearr = htmlsrc[0].match(/Style\:(.*)[\n\r]/) || [];
            var scorearr = htmlsrc[0].match(/BA SCORE\s+(\d{2,3})[\n\r\t]/) || [];

            var abv = abvarr.length > 0 ? abvarr[1].trim() : "";
            var style = stylearr.length > 0 ? stylearr[1].trim() : "";
            var score = scorearr.length > 0 ? scorearr[1].trim() : "";

            var beers = [];
            beers[0] = {
              tap: arr[1],
              name: arr[2],
              url: resp.items[0].link || "",
              abv: abv || "???",
              style: style || "???",
              score: score || "???",
              tap_date: tap_date,
              size: 5
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
                text: `${toUnicode(beer.tap, 'circled')}  •  ABV ${beer.abv}%  •  ${beer.style}\n🏅 ${beer.score}/100  •  Days on tap: ${helpers.daysOnTap(beer.tap_date)}  •  🍺`,
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
          } else {
            attachments = [
              {
                text: 'Oops. Internet fail.',
                mrkdwn_in: ['text']
              }
            ];
            let msg = _.defaults({
              channel: payload.channel_name,
              attachments: attachments
            }, msgDefaults)

            res.set('content-type', 'application/json')
            res.status(200).json(msg)
            return
          }
        })
    });
  } else if (payload.text.match(/^manual \d+ .*$/)) {

    // TAP A BEER THE HARD WAY
    // /beer manual 1 "Tasty Beer" "http://www.beeradvocate/beer/profile/xxx" 8.5 "American IPA" 95 "2016-07-08 17:00" 5

    var arr = parseString(cognate.replace(payload.text)) || [];

    let attachments = [];

    var beers = [];
    beers[0] = {
      tap: arr[1],
      name: arr[2],
      url: arr[3],
      abv: arr[4],
      style: arr[5],
      score: arr[6],
      tap_date: arr[7] ,
      size: arr[8] || 5
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
        text: `${toUnicode(beer.tap, 'circled')}  •  ABV ${beer.abv}%  •  ${beer.style}\n🏅 ${beer.score}/100  •  Days on tap: ${helpers.daysOnTap(beer.tap_date)}  •  🍺`,
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

  } else {
    // HELP!
    let attachments = [
      {
        title: 'Tap a keg the easy way:',
        color: '#2FA44F',
        text: '`/beer set 1 Brooklyn Lager`\nSets tap #1 to Brooklyn Lager, grabs beer data automatically if it can be found, and sets tapped date to right now',
        mrkdwn_in: ['text']
      },
      {
        title: 'Tap a keg the easy way (with manual date & time):',
        color: '#fdd350',
        text: '`/beer set 1 Brooklyn Lager 2016-07-01 17:00`\nSets tap #1 to Brooklyn Lager, grabs beer data automatically and sets tapped date to July 1st at 5pm Eastern',
        mrkdwn_in: ['text']
      },
      {
        title: 'Tap a keg the hard way:',
        color: '#b94545',
        text: '`/beer manual 1 "Brooklyn Lager" "http://www.beeradvocate.com/beer/profile/45/148/" 8.50 "American Amber" 86 "2016-07-01 17:00" 5`\nSets all info about a new beer manually. All parameters are required. Make sure to double-quote name, URL, beer style, and date & time.\n*Parameters:* tap number, beer name, BA URL, ABV, beer style, BA score, date & time tapped, keg size in gallons',
        mrkdwn_in: ['text']
      },
      {
        title: 'Set tap to empty:',
        color: '#303030',
        text: '`/beer set 1 empty`\nSets tap #1 to empty',
        mrkdwn_in: ['text']
      }
    ]

    let msg = _.defaults({
      channel: payload.channel_name,
      attachments: attachments
    }, msgDefaults)

    res.set('content-type', 'application/json')
    res.status(200).json(msg)
    return
  }

}

module.exports = {
  pattern: /set|manual/ig,
  handler: handler
}
