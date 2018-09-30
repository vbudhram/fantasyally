const Player = require('./models/player');
const fs = require('fs');
const CURRENT_WEEK = 4;

const projections = require('./data/week4/espn_week4_projections_1538318265666');
const actuals = require('./data/week4/espn_week1_actuals_1538279010983');

const projectionsMap = new Map(projections.map(i => [i.playerId, new Player(i)]));
const actualsMap = new Map(actuals.map(i => [i.playerId, new Player(i)]));

const positions = ["QB", "RB", "WR", "TE"];

function writeBlog () {
	const filename = `${formattedDate()}-week-${CURRENT_WEEK}-analysis.md`

	let fileString = '';
	fileString += '---';
	fileString += '\r\nauthor: Vijay Budhram';
	fileString += '\r\nauthorURL: https://twitter.com/vjbudhram';
	fileString += `\r\ntitle: Week ${CURRENT_WEEK} Analysis`;
	fileString += `\r\n---`;
	fileString += `\r\n`;
	fileString += `\r\nHello everyone!`;
	fileString += `\r\n`;
	fileString += `\r\n`;

	const mapKeys = [...projectionsMap.keys()];

	const players = mapKeys.map((key) => projectionsMap.get(key));
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
		fileString += '\r\n|Rank|Name|Team|Projected PPR|Actual PPR|Difference| Percent %|';
		fileString += '\r\n|---|---|---|---|---|---|---|';

		filteredPlayers.forEach((player, index) => {
			index++;

			const playerActual = actualsMap.get(player.playerId);

			if (!playerActual) {
				console.log(`Skipping ${player.playerId}, unable to find actual`);
			} else {
				if (playerActual.pointsPPR <= 0 && player.pointsPPR <=0) {
					console.log(`Skipping ${player.playerId}, no stats accumulated`);
				} else {
					const stats = playerActual.compare(player);
					const pointDifferencePPR = stats.pointDifferencePPR > 0 ? "+" + stats.pointDifferencePPR : stats.pointDifferencePPR;
					fileString += `\r\n|${index}|${player.name}|${player.team}|${player.pointsPPR}|${playerActual.pointsPPR}|${pointDifferencePPR}|${stats.percentPPR}%|`;
				}
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

const statsMap = writeBlog();

writeBlog(statsMap);
