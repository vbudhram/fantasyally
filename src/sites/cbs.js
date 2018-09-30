const utils = require('../utils');
const CBS = require('../models/cbs');

const CURRENT_WEEK = 4;

CBS.getProjections(CURRENT_WEEK)
	.then((players) => utils.save(CURRENT_WEEK, 'cbs', players, 'projections'));
