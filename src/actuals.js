const ESPN = require('./models/espn');
const utils = require('./utils');

const CURRENT_WEEK = 4;

ESPN.getActuals(CURRENT_WEEK)
	.then((playersMap) => utils.save(CURRENT_WEEK, 'espn', playersMap, 'actuals'));
