const POINTS_PER_PASS_YARD = 1 / 25;
const POINTS_PER_PASS_TD = 4;
const POINTS_PER_PASS_INT = -2;

const POINTS_PER_RUSH_YARD = 1 / 10;
const POINTS_PER_RUSH_TD = 6;

const POINTS_PER_REC_YARD = 1 / 10;
const POINTS_PER_REC_TD = 6;
const POINTS_PER_REC = 1;

class Player {
	constructor (playerObj) {
		this.name = playerObj.name;
		this.playerId = playerObj.playerId;
		this.position = playerObj.position;
		this.team = playerObj.team;

		this.pass = playerObj.pass || {};
		this.pass.completion = parseFloat(this.pass.completion) || 0;
		this.pass.attempts = parseFloat(this.pass.attempts) || 0;
		this.pass.yards = parseFloat(this.pass.yards) || 0;
		this.pass.tds = parseFloat(this.pass.tds) || 0;
		this.pass.int = parseFloat(this.pass.int) || 0;
		this.pass.rate = parseFloat(this.pass.rate) || 0;

		this.rush = playerObj.rush || {};
		this.rush.attempts = parseFloat(this.rush.attempts) || 0;
		this.rush.yards = parseFloat(this.rush.yards) || 0;
		this.rush.tds = parseFloat(this.rush.tds) || 0;

		this.receive = playerObj.receive || {};
		this.receive.target = parseFloat(this.receive.target) || 0;
		this.receive.reception = parseFloat(this.receive.reception) || 0;
		this.receive.yards = parseFloat(this.receive.yards) || 0;
		this.receive.tds = parseFloat(this.receive.tds) || 0;

		this.misc = playerObj.misc || {};
		this.misc.twopc = parseFloat(this.misc.twopc || 0);
		this.misc.fuml = parseFloat(this.misc.fuml || 0);
		this.misc.tds = parseFloat(this.misc.tds || 0);

		this.count = playerObj.count || 1;

		this.calulatePoints();
	}

	calulatePoints () {
		this.pointsPPR =
			this.pass.yards * POINTS_PER_PASS_YARD + this.pass.int * POINTS_PER_PASS_INT + this.pass.tds * POINTS_PER_PASS_TD +
			this.rush.yards * POINTS_PER_RUSH_YARD + this.rush.tds * POINTS_PER_RUSH_TD +
			this.receive.yards * POINTS_PER_REC_YARD + this.receive.tds * POINTS_PER_REC_TD + this.receive.reception * POINTS_PER_REC;
		this.pointsPPR = Math.round(this.pointsPPR * 100) / 100;

		this.points =
			this.pass.yards * POINTS_PER_PASS_YARD + this.pass.int * POINTS_PER_PASS_INT + this.pass.tds * POINTS_PER_PASS_TD +
			this.rush.yards * POINTS_PER_RUSH_YARD + this.rush.tds * POINTS_PER_RUSH_TD +
			this.receive.yards * POINTS_PER_REC_YARD + this.receive.tds * POINTS_PER_REC_TD;
		this.points = Math.round(this.points * 100) / 100;
	}

	static normalizeName (name) {
		name = name.replace(/(\.)/g, "");
		name = name.replace(/(II)/g, "").trim();
		name = name.replace(/(Jr)/g, "").trim();
		name = name.replace(/(\*)/g, "").trim();
		return name;
	}

	static normalizeTeam (team) {
		team = team.replace(/(\*)/g, "");

		if (team === "WSH") {
			team = "WAS";
		}

		if (team === "JAC") {
			team = "JAX"
		}
		return team;
	}

	compare (player) {
		return {
			pointDifference: Math.round((this.points - player.points) * 100) / 100,
			pointDifferencePPR: Math.round((this.pointsPPR - player.pointsPPR) * 100) / 100,
			percent: Math.round(this.points / player.pointsPPR * 100),
			percentPPR: Math.round(this.pointsPPR / player.pointsPPR * 100)
		};
	}

	addPlayerStats (player) {
		this.pass.completion += player.pass.completion;
		this.pass.attempts += player.pass.attempts;
		this.pass.yards += player.pass.yards;
		this.pass.tds += player.pass.tds;
		this.pass.int += player.pass.int;

		this.rush.attempts += player.rush.attempts;
		this.rush.yards += player.rush.yards;
		this.rush.tds += player.rush.tds;

		this.receive.reception += player.receive.reception;
		this.receive.yards += player.receive.yards;
		this.receive.tds += player.receive.tds;

		this.count = this.count + 1;
	}

	updateAverage () {
		this.pass.completion = this.pass.completion / this.count;
		this.pass.attempts = this.pass.attempts / this.count;
		this.pass.yards = this.pass.yards / this.count;
		this.pass.tds = this.pass.tds / this.count;
		this.pass.int = this.pass.int / this.count;

		this.rush.attempts = this.rush.attempts / this.count;
		this.rush.yards = this.rush.yards / this.count;
		this.rush.tds = this.rush.tds / this.count;

		this.receive.reception = this.receive.reception / this.count;
		this.receive.yards = this.receive.yards / this.count;
		this.receive.tds = this.receive.tds / this.count;

		this.calulatePoints();
	}
}

module.exports = Player;
