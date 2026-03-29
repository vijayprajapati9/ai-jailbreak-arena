const { teams, leaderboard } = require("../models/collections");

// POST /team/login
const loginTeam = async (req, res) => {
    try {
        const { teamId, password } = req.body;
        if (!teamId || !password)
            return res.status(400).json({ success: false, error: "teamId and password required" });

        const team = await teams().findOne({ teamId, password });
        if (team) {
            res.json({ success: true, teamId: team.teamId, attempts: team.attempts });
        } else {
            res.status(401).json({ success: false, error: "Invalid credentials" });
        }
    } catch (err) {
        console.error("[teamController.loginTeam]", err.message);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// POST /team/start
const startTeam = async (req, res) => {
    try {
        const { teamId } = req.body;
        if (!teamId)
            return res.status(400).json({ success: false, error: "teamId required" });

        const result = await teams().updateOne(
            { teamId },
            { $set: { startTime: Date.now() } }
        );
        if (result.matchedCount > 0) res.json({ success: true });
        else res.status(404).json({ success: false, error: "Team not found" });
    } catch (err) {
        console.error("[teamController.startTeam]", err.message);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// GET /api/leaderboard (public)
const getPublicLeaderboard = async (req, res) => {
    try {
        const board = await leaderboard()
            .find({}, { projection: { _id: 0 } })
            .sort({ attemptsUsed: 1, timeTaken: 1 })
            .toArray();
        res.json(board);
    } catch (err) {
        console.error("[teamController.getPublicLeaderboard]", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { loginTeam, startTeam, getPublicLeaderboard };
