const cheerio = require('cheerio');
const request = require('request-promise');
const Player = require('./player');
const Promise = require('bluebird');

class CBS {
	static fromProjectionRow (row, position) {
		const name = Player.normalizeName(row.children[0].children[0].children[0].data);

		const teamPosition = row.children[0].children[1].data.replace(/, /g, "").toUpperCase().split(/\s+/);
		const team = Player.normalizeTeam(teamPosition[0]);

		let pass = {};
		try {
			pass = {
				completion: row.children[2].children[0].data,
				attempts: row.children[1].children[0].data,
				yards: row.children[3].children[0].data,
				tds: row.children[4].children[0].data,
				int: row.children[5].children[0].data,
				rate: row.children[6].children[0].data
			}
		} catch (err) {
			console.log(`Failed to parse pass for ${name}`);
		}

		let rush = {}, receive = {};
		try {
			rush = {
				attempts: row.children[7].children[0].data,
				yards: row.children[8].children[0].data,
				tds: row.children[10].children[0].data,
			}

			receive = {
				target: row.children[11].children[0].data,
				reception: row.children[12].children[0].data,
				yards: row.children[13].children[0].data,
				tds: row.children[15].children[0].data,
			}
		} catch (err) {
			console.log(`Failed to parse rush/receive for ${name}`);
		}

		const playerId = name.toUpperCase() + team + position;

		return new Player({
			name,
			team,
			position,
			pass,
			rush,
			receive,
			playerId
		});
	}

	static parsePage ($, players, position) {
		return Promise.resolve()
			.then(() => {
				let rows = $(".row1");
				for (let i = 1; i < rows.length; i++) {
					const player = CBS.fromProjectionRow(rows[i], position);
					const playerId = player.playerId
					if (!players.has(playerId)) {
						players.set(playerId, player)
					}
				}

				rows = $(".row2");
				for (let i = 0; i < rows.length; i++) {
					const player = CBS.fromProjectionRow(rows[i], position);
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

	static getProjections (week) {
		const defers = [];
		const players = new Map();

		// Get QBs
		let path = `https://www.cbssports.com/fantasy/football/stats/sortable/points/QB/ppr/projections/2018/${week}?&_1:col_1=4&_1:col_2=18`;
		let options = {
			uri: path,
			transform: (body) => cheerio.load(body)
		};
		console.log("Parsing: " + path);
		defers.push(request(options));

		// Get RBs
		for (let i = 0; i < 150; i += 50) {
			path = `https://www.cbssports.com/fantasy/football/stats/sortable/points/RB/ppr/projections/2018/${week}?&_1:col_1=9&start_row=${i}`;
			console.log("Parsing: " + path);
			options = {
				uri: path,
				transform: (body) => cheerio.load(body)
			};
			defers.push(request(options))
		}

		// Get WRs
		for (let i = 0; i < 200; i += 50) {
			path = `https://www.cbssports.com/fantasy/football/stats/sortable/points/WR/ppr/projections/2018/${week}?&_1:col_1=14&start_row=${i}`;
			console.log("Parsing: " + path);
			options = {
				uri: path,
				transform: (body) => cheerio.load(body)
			};
			defers.push(request(options))
		}

		// Get TEs
		for (let i = 0; i < 101; i += 50) {
			path = `https://www.cbssports.com/fantasy/football/stats/sortable/points/TE/ppr/projections/2018/${week}?&_1:col_1=14&start_row=${i}`;
			console.log("Parsing: " + path);
			options = {
				uri: path,
				transform: (body) => cheerio.load(body)
			};
			defers.push(request(options))
		}

		return Promise.each(defers, ($, index) => {
			switch (index) {
				case 0:
					return CBS.parsePage($, players, "QB");
				case 1:
				case 2:
				case 3:
					return CBS.parsePage($, players, "RB");
				case 4:
				case 5:
				case 6:
				case 7:
					return CBS.parsePage($, players, "WR");
				case 8:
				case 9:
				case 10:
					return CBS.parsePage($, players, "TE");
			}
		})
			.then(() => players)
	}
}

module.exports = CBS;
