const cheerio = require('cheerio');
const request = require('request-promise');
const Promise = require('bluebird');
const fs = require('fs');

const currentWeek = 3;

function print (players) {
	players.forEach((player) => {
		console.log(`${player.name}\t\t${player.position}\t`);
	})
}

function parseRow (row, position) {
	let name = row.children[0].children[0].children[0].data;

	// Let's do some quick normalization for names
	name = name.replace(/(\.)/g, "");
	name = name.replace(/(II)/g, "").trim();
	name = name.replace(/(Jr)/g, "").trim();

	const teamPosition = row.children[0].children[1].data.replace(/, /g, "").toUpperCase().split(/\s+/);
	const team = teamPosition[0];

	const pass = {
		completion: row.children[2].children[0].data,
		attempts: row.children[1].children[0].data,
		yards: row.children[3].children[0].data,
		tds: row.children[4].children[0].data,
		int: row.children[5].children[0].data,
		rate: row.children[6].children[0].data
	}

	const rush = {
		attempts: row.children[7].children[0].data,
		yards: row.children[8].children[0].data,
		tds: row.children[10].children[0].data,
	}

	const receive = {
		target: row.children[11].children[0].data,
		reception: row.children[12].children[0].data,
		yards: row.children[13].children[0].data,
		tds: row.children[15].children[0].data,
	}

	const playerId = name.toUpperCase() + team + position;

	return {
		name,
		team,
		position,
		pass,
		rush,
		receive,
		playerId
	}
}

function parsePage ($, players, position) {
	return Promise.resolve()
		.then(() => {
			let rows = $(".row1");
			for (let i = 1; i < rows.length; i++) {
				const player = parseRow(rows[i], position);
				const playerId = player.playerId
				if (!players.has(playerId)) {
					players.set(playerId, player)
				}
			}

			rows = $(".row2");
			for (let i = 0; i < rows.length; i++) {
				const player = parseRow(rows[i], position);
				const playerId = player.playerId
				if (!players.has(playerId)) {
					players.set(playerId, player)
				}
			}
		})
		.catch((err) => {
			console.log("Error: " + err.message);
		})
}

function save (playersMap) {
	console.log(`cbs_${currentWeek}.json`);

	const players = [];
	playersMap.forEach((player) => {
		players.push(player);
	});

	fs.writeFileSync(`cbs_week${currentWeek}.json`, JSON.stringify(players));
}

function getProjections () {
	const defers = [];
	const players = new Map();

	// Get QBs
	let path = `https://www.cbssports.com/fantasy/football/stats/sortable/points/QB/ppr/projections/2018/${currentWeek}?&_1:col_1=4&_1:col_2=18`;
	let options = {
		uri: path,
		transform: (body) => cheerio.load(body)
	};
	console.log("Parsing: " + path);
	defers.push(request(options));

	// Get RBs
	for (let i = 0; i < 150; i += 50) {
		path = `https://www.cbssports.com/fantasy/football/stats/sortable/points/RB/ppr/projections/2018/${currentWeek}?&_1:col_1=9&start_row=${i}`;
		console.log("Parsing: " + path);
		options = {
			uri: path,
			transform: (body) => cheerio.load(body)
		};
		defers.push(request(options))
	}

	// Get WRs
	for (let i = 0; i < 200; i += 50) {
		path = `https://www.cbssports.com/fantasy/football/stats/sortable/points/WR/ppr/projections/2018/${currentWeek}?&_1:col_1=14&start_row=${i}`;
		console.log("Parsing: " + path);
		options = {
			uri: path,
			transform: (body) => cheerio.load(body)
		};
		defers.push(request(options))
	}

	// Get TEs
	for (let i = 0; i < 101; i += 50) {
		path = `https://www.cbssports.com/fantasy/football/stats/sortable/points/TE/ppr/projections/2018/${currentWeek}?&_1:col_1=14&start_row=${i}`;
		console.log("Parsing: " + path);
		options = {
			uri: path,
			transform: (body) => cheerio.load(body)
		};
		defers.push(request(options))
	}

	return Promise.each(defers, ($, index, result) => {

		switch (index) {
			case 0:
				return parsePage($, players, "QB");
			case 1:
			case 2:
			case 3:
				return parsePage($, players, "RB");
			case 4:
			case 5:
			case 6:
			case 7:
				return parsePage($, players, "WR");
			case 8:
			case 9:
			case 10:
				return parsePage($, players, "TE");
		}
	})
		.then(() => {
			print(players)
			return players;
		})
}

getProjections()
	.then((players) => save(players));
