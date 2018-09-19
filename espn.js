const cheerio = require('cheerio');
const request = require('request-promise');
const Promise = require('bluebird');
const fs = require('fs');

const currentWeek = 3;

function print (players) {
	players.forEach((player) => {
		console.log(`${player.name}\t\t${player.position}\t${player.opponent.team}\t`);
	})
}

function parsePage ($, players) {
	return Promise.resolve()
		.then(() => {
			let rows = $(".pncPlayerRow");
			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				let name = row.children[0].children[0].children[0].data;

				// Let's do some quick normalization for names
				name = name.replace(/(\.)/g, "");
				name = name.replace(/(II)/g, "").trim();
				name = name.replace(/(Jr)/g, "").trim();

				const teamPosition = row.children[0].children[1].data.replace(/, /g, "").toUpperCase().split(/\s+/);
				const team = teamPosition[0];
				const position = teamPosition[1];

				const opponent = {
					team: row.children[1].children[0].children[0].children[0].data.toUpperCase(),
					time: row.children[2].children[0].children[0].data
				}

				const completionAttempts = row.children[3].children[0].data.split("/");
				const pass = {
					completion: completionAttempts[0],
					attempts: completionAttempts[1],
					yards: row.children[4].children[0].data,
					tds: row.children[5].children[0].data,
					int: row.children[6].children[0].data
				}

				const rush = {
					attempts: row.children[7].children[0].data,
					yards: row.children[8].children[0].data,
					tds: row.children[9].children[0].data,
				}

				const receive = {
					reception: row.children[10].children[0].data,
					yards: row.children[11].children[0].data,
					tds: row.children[12].children[0].data,
				}

				const playerId = name.toUpperCase() + team + position;

				if (!players.has(playerId)) {
					players.set(playerId, {
						name,
						team,
						position,
						opponent,
						pass,
						rush,
						receive,
						playerId
					})
				}
			}
		})
		.catch((err) => {
			// console.log("Error: " + err.message);
		})
}

function save (playersMap) {
	console.log('Saving espn.json')

	const players = [];
	playersMap.forEach((player) => {
		players.push(player);
	});

	fs.writeFileSync(`espn_week${currentWeek}.json`, JSON.stringify(players));
}

function getESPNProjections () {
	const defers = [];
	const players = new Map();

	for (let i = 0; i < 500; i += 40) {
		let path = `http://games.espn.com/ffl/tools/projections?&scoringPeriodId=${currentWeek}&seasonId=2018&startIndex=${i}`;
		const options = {
			uri: path,
			transform: (body) => cheerio.load(body)
		};
		console.log("Parsing: " + path);
		defers.push(request(options))
	}

	return Promise.each(defers, ($, index, result) => {
		return parsePage($, players);
	})
		.then(() => {
			print(players)
			return players;
		})
}

getESPNProjections()
	.then((players) => save(players));
