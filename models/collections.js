const { getDB } = require("../config/db");

const teams      = () => getDB().collection("teams");
const leaderboard = () => getDB().collection("leaderboard");

module.exports = { teams, leaderboard };
