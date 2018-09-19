const cbs = require("./data/cbs_week3");
const espn = require("./data/espn_week3");
const fs = require("fs");

const cbsMap = new Map(cbs.map(i => [i.playerId, i]));
const espnMap = new Map(espn.map(i => [i.playerId, i]));

const currentWeek = 3;

const POINTS_PER_PASS_YARD = 1 / 25;
const POINTS_PER_PASS_TD = 4;
const POINTS_PER_PASS_INT = -2;

const POINTS_PER_RUSH_YARD = 1 / 10;
const POINTS_PER_RUSH_TD = 6;

const qbKeys = cbs.filter((item) => {
	return item.position === "QB";
}).map((item) => {
	return item.playerId
})

// Get QB averages
const averages = new Map();
for (let i = 0; i < qbKeys.length; i++) {
	const key = qbKeys[i];

	const playerTotals = {
		"position": "QB",
		"pass": {
			"completion": 0.0,
			"attempts": 0,
			"yards": 0,
			"tds": 0,
			"int": 0,
			"rate": 0
		},
		"rush": {
			"attempts": 0,
			"yards": 0,
			"tds": 0
		},
		"receive": {
			"target": 0,
			"reception": 0,
			"yards": 0,
			"tds": 0
		},
		"playerId": key,
		"count": 0
	};

	if (cbsMap.has(key)) {
		const player = cbsMap.get(key);
		addPlayerTotals(player, playerTotals);
	}

	if (espnMap.has(key)) {
		const player = espnMap.get(key);
		addPlayerTotals(player, playerTotals);
	}

	const player = getAverage(playerTotals);

	averages.set(playerTotals.playerId, player);
}

save(averages);

function getAverage (playerTotals) {
	playerTotals.pass.completion = playerTotals.pass.completion / playerTotals.count;
	playerTotals.pass.attempts = playerTotals.pass.attempts / playerTotals.count;
	playerTotals.pass.yards = playerTotals.pass.yards / playerTotals.count;
	playerTotals.pass.tds = playerTotals.pass.tds / playerTotals.count;
	playerTotals.pass.int = playerTotals.pass.int / playerTotals.count;

	playerTotals.rush.attempts = playerTotals.rush.attempts / playerTotals.count;
	playerTotals.rush.yards = playerTotals.rush.yards / playerTotals.count;
	playerTotals.rush.tds = playerTotals.rush.tds / playerTotals.count;

	playerTotals.expectedPoints = playerTotals.pass.yards * POINTS_PER_PASS_YARD + playerTotals.pass.int * POINTS_PER_PASS_INT + playerTotals.pass.tds * POINTS_PER_PASS_TD
		+ playerTotals.rush.yards * POINTS_PER_RUSH_YARD + playerTotals.rush.tds * POINTS_PER_RUSH_TD;

	return playerTotals;
}


function addPlayerTotals (player, playerTotals) {
	playerTotals.pass.completion += parseFloat(player.pass.completion);
	playerTotals.pass.attempts += parseFloat(player.pass.attempts);
	playerTotals.pass.yards += parseFloat(player.pass.yards);
	playerTotals.pass.tds += parseFloat(player.pass.tds);
	playerTotals.pass.int += parseFloat(player.pass.int);

	playerTotals.rush.attempts += parseFloat(player.rush.attempts);
	playerTotals.rush.yards += parseFloat(player.rush.yards);
	playerTotals.rush.tds += parseFloat(player.rush.tds);

	playerTotals.count = playerTotals.count + 1;
}

function save (playersMap) {
	console.log(`averages_${currentWeek}.json`);

	const players = [];
	playersMap.forEach((player) => {
		players.push(player);
	});

	players.sort(function (a, b) {
		return b.expectedPoints - a.expectedPoints;
	});

	fs.writeFileSync(`averages_week${currentWeek}.json`, JSON.stringify(players));
}
