const { getDB } = require("../config/db");

const teams       = () => getDB().collection("teams");
const leaderboard = () => getDB().collection("leaderboard");
const teamChatCollection = (teamId) => {
    const cleanId = String(teamId).replace(/[^a-zA-Z0-9_-]/g, "");
    return getDB().collection(`chat_${cleanId}`);
};

module.exports = { teams, leaderboard, teamChatCollection };
