const express = require("express");
const router  = express.Router();
const { getPublicLeaderboard } = require("../controllers/teamController");

router.get("/leaderboard", getPublicLeaderboard);

module.exports = router;
