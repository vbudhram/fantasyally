const fs = require('fs');
const path = require('path');

function save (currentWeek, source, playersMap, type = 'projections') {
	const filename = `${source}_week${currentWeek}_${type}_${Date.now()}.json`;

	const dir = [__dirname, 'data', `week${currentWeek}`].join('/');
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}

	const filePath = path.join([dir, filename].join('/'));

	console.log(`Saving ${filePath}`);

	const players = [];
	playersMap.forEach((player) => {
		players.push(player);
	});

	fs.writeFileSync(filePath, JSON.stringify(players));
}

module.exports = {
	save
};
