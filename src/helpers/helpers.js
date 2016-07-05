exports.dateFromObjectId = (objectId) => {
	return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
};

exports.daysBetween = (date1, date2) => {
  const ONE_DAY = 1000 * 60 * 60 * 24
  var date1_ms = date1.getTime()
  var date2_ms = date2.getTime()
  var difference_ms = Math.abs(date1_ms - date2_ms)
  return Math.ceil(difference_ms/ONE_DAY)
}

exports.daysOnTap = (date) => {
  return exports.daysBetween(exports.dateFromObjectId(date), Date.now())
}
