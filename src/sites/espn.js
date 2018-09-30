const utils = require('../utils');
const ESPN = require('../models/espn');

const CURRENT_WEEK = 4;

ESPN.getProjections(CURRENT_WEEK)
	.then((players) => utils.save(CURRENT_WEEK, 'espn', players, 'projections'));
