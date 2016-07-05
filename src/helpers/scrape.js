module.exports.scrapeData = function (url, selector, callback) {
    var Xray = require('x-ray');
    var x = Xray();
    var scraped = '';
    x(url, selector])(function (err, obj) {
        if (err) return callback(err);
        for (var i = obj.length - 1; i >= 0; i--) {
            scraped += obj[i]
        };
        callback(null, scraped);
    });
}
