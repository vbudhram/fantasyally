const CURRENT_WEEK = 4;

const cbs = require("./data/week4/cbs_week4_projections_1538318273156");
const espn = require("./data/week4/espn_week4_projections_1538318265666");

const fs = require("fs");
const path = require('path');
const Player = require('./models/player');

const cbsMap = new Map(cbs.map(i => [i.playerId, new Player(i)]));
const espnMap = new Map(espn.map(i => [i.playerId, new Player(i)]));

const positions = ["QB", "RB", "WR", "TE"];

function getPlayerAverages (cbsMap, espnMap) {
	const averages = new Map();

	const mapKeys = [...cbsMap.keys()];
	const players = mapKeys.map((key) => cbsMap.get(key));

	players.forEach((player) => {
		const playerId = player.playerId;

		// if (cbsMap.has(playerId)) {
		// 	player.addPlayerStats(cbsMap.get(playerId));
		// }

		if (espnMap.has(playerId)) {
			player.addPlayerStats(espnMap.get(playerId));
		}

		player.updateAverage();

		averages.set(playerId, player);
	});

	return averages;
}

function writeBlog (averagesMap) {
	const filename = `${formattedDate()}-week-${CURRENT_WEEK}-rankings.md`

	let fileString = '';
	fileString += '---';
	fileString += '\r\nauthor: Vijay Budhram';
	fileString += '\r\nauthorURL: https://twitter.com/vjbudhram';
	fileString += `\r\ntitle: Week ${CURRENT_WEEK} Rankings`;
	fileString += `\r\n---`;
	fileString += `\r\n`;
	fileString += `\r\nHello everyone!`;
	fileString += `\r\n`;
	fileString += `\r\n`;
	fileString += `\r\n<!--truncate-->`;
	fileString += `\r\n`;

	const mapKeys = [...averagesMap.keys()];

	const players = mapKeys.map((key) => averagesMap.get(key));
	positions.forEach((position) => {
		const filteredPlayers = players.filter((player) => {
			if (player.position === position) {
				return player;
			}
		});

		filteredPlayers.sort(function (a, b) {
			return b.pointsPPR - a.pointsPPR;
		});

		fileString += `\r\n## ${position}`;
		fileString += '\r\n|Rank|Name|Team|Expected Points|PPR Expected Points|';
		fileString += '\r\n|---|---|---|---|---|';

		filteredPlayers.forEach((player, index) => {
			index++;

			if (player.pointsPPR > 0) {
				fileString += `\r\n|${index}|${player.name}|${player.team}|${Math.round(player.points * 100) / 100}|${Math.round(player.pointsPPR * 100) / 100}|`;
			}
		});

		fileString += `\r\n`;
	});

	fs.writeFileSync(filename, fileString);
}

function formattedDate (d = new Date) {
	let month = String(d.getMonth() + 1);
	let day = String(d.getDate());
	const year = String(d.getFullYear());

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;

	return `${year}-${month}-${day}`;
}

function save (averages) {
	const filename = `averages_week${CURRENT_WEEK}_${Date.now()}.json`;
	const filePath = path.join([__dirname, 'data', `week${CURRENT_WEEK}`, filename].join('/'));
	console.log(`${path}`);

	const players = [];
	averages.forEach((player) => {
		players.push(player);
	});

	fs.writeFileSync(filePath, JSON.stringify(players));
}

const averages = getPlayerAverages(cbsMap, espnMap);
save(averages)

writeBlog(averages);
