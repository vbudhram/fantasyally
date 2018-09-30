const cheerio = require('cheerio');
const request = require('request-promise');
const Player = require('./player');
const Promise = require('bluebird');

class ESPN {
	static fromProjectionRow (row) {
		const name = Player.normalizeName(row.children[0].children[0].children[0].data);

		const teamPosition = row.children[0].children[1].data.replace(/, /g, "").toUpperCase().split(/\s+/);
		const team = Player.normalizeTeam(teamPosition[0]);
		const position = teamPosition[1];

		let opponent = {}
		try {
			opponent = {
				team: row.children[1].children[0].children[0].children[0].data.toUpperCase(),
				time: row.children[2].children[0].children[0].data
			};
		} catch (err) {
			console.log(`Failed to parse opponent for ${name}`);
		}

		let pass = {};
		try {
			const completionAttempts = row.children[3].children[0].data.split("/");
			pass = {
				completion: completionAttempts[0],
				attempts: completionAttempts[1],
				yards: row.children[4].children[0].data,
				tds: row.children[5].children[0].data,
				int: row.children[6].children[0].data
			};
		} catch (err) {
			console.log(`Failed to parse completionAttempts for ${name}`);
		}

		let rush = {}, receive = {};
		try {
			rush = {
				attempts: row.children[7].children[0].data,
				yards: row.children[8].children[0].data,
				tds: row.children[9].children[0].data,
			}

			receive = {
				reception: row.children[10].children[0].data,
				yards: row.children[11].children[0].data,
				tds: row.children[12].children[0].data,
			};
		} catch (err) {
			console.log(`Failed to parse rush/receive for ${name}`);
		}

		const playerId = name.toUpperCase() + team + position;

		return new Player({
			name,
			team,
			position,
			opponent,
			pass,
			rush,
			receive,
			playerId
		});
	}

	static fromActualRow (row) {
		const name = Player.normalizeName(row.children[0].children[0].children[0].data);

		const teamPosition = row.children[0].children[1].data.replace(/, /g, "").toUpperCase().split(/\s+/);
		const team = Player.normalizeTeam(teamPosition[0]);
		const position = teamPosition[1];

		let opponent = {}
		try {
			opponent = {
				team: row.children[2].children[0].children[0].children[0].data.toUpperCase(),
				time: row.children[3].children[0].children[0].data
			}
		} catch (err) {
			console.log(`Failed to parse opponent for ${name}`);
		}

		let pass = {};
		try {
			const completionAttempts = row.children[5].children[0].data.split("/");
			pass = {
				completion: completionAttempts[0],
				attempts: completionAttempts[1],
				yards: row.children[6].children[0].data,
				tds: row.children[7].children[0].data,
				int: row.children[8].children[0].data
			}
		} catch (err) {
			console.log(`Failed to parse completionAttempts for ${name}`);
		}

		let rush = {}, receive = {}, misc = {};
		try {
			rush = {
				attempts: row.children[10].children[0].data,
				yards: row.children[11].children[0].data,
				tds: row.children[12].children[0].data,
			}

			receive = {
				reception: row.children[14].children[0].data,
				yards: row.children[15].children[0].data,
				tds: row.children[16].children[0].data,
			}

			misc = {
				twopc: row.children[19].children[0].data,
				fuml: row.children[20].children[0].data,
				tds: row.children[21].children[0].data,
			}
		} catch (err) {
			console.log(`Failed to parse rush/receive for ${name}`);
		}

		const playerId = name.toUpperCase() + team + position;

		return new Player({
			name,
			team,
			position,
			opponent,
			pass,
			rush,
			receive,
			misc,
			playerId
		});
	}

	static getActuals (week) {
		const defers = [];
		const players = new Map();

		for (let i = 0; i < 500; i += 40) {
			let path = `http://games.espn.com/ffl/leaders?leagueId=0&scoringPeriodId=${week}&seasonId=2018&startIndex=${i}`;
			const options = {
				uri: path,
				transform: (body) => cheerio.load(body)
			};
			console.log("Parsing: " + path);
			defers.push(request(options))
		}

		return Promise.each(defers, ($) => {
			let rows = $(".pncPlayerRow");
			for (let i = 0; i < rows.length; i++) {
				const player = ESPN.fromActualRow(rows[i]);
				if (!players.has(player.playerId)) {
					players.set(player.playerId, player)
				}
			}
		})
			.then(() => players)
	}

	static getProjections (week) {
		const defers = [];
		const players = new Map();

		for (let i = 0; i < 500; i += 40) {
			let path = `http://games.espn.com/ffl/tools/projections?&scoringPeriodId=${week}&seasonId=2018&startIndex=${i}`;
			const options = {
				uri: path,
				transform: (body) => cheerio.load(body)
			};
			console.log("Parsing: " + path);
			defers.push(request(options))
		}

		return Promise.each(defers, ($) => {
			let rows = $(".pncPlayerRow");
			for (let i = 0; i < rows.length; i++) {
				const player = ESPN.fromProjectionRow(rows[i]);
				if (!players.has(player.playerId)) {
					players.set(player.playerId, player)
				}
			}
		})
			.then(() => players)
	}
}

module.exports = ESPN;
