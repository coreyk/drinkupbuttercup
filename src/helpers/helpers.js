const _ = require('lodash')

exports.dateFromObjectId = (objectId) => {
	return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
};

exports.daysBetween = (date1, date2) => {
  var oneDay = 24*60*60*1000;
  var firstDate = new Date(date1);
  var secondDate = new Date(date2);
	var diffDays = Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay));
	console.log(diffDays);
  return diffDays;
}

exports.daysOnTap = (date) => {
	// return Math.ceil(exports.daysBetween(date, Date.now()));
  return parseFloat(exports.daysBetween(date, Date.now())).toFixed(1);
}

exports.isBlank = (value) => {
	// return _.isNil(value) && _.isEmpty(value) && !_.isNumber(value) && _.isNaN(value);
	return _.isEmpty(value) && !_.isNumber(value) || _.isNaN(value);
}
