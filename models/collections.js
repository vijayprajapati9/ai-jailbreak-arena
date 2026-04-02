const { getDB } = require("../config/db");

const teams       = () => getDB().collection("teams");
const leaderboard = () => getDB().collection("leaderboard");
const chats       = () => getDB().collection("chats");

module.exports = { teams, leaderboard, chats };
