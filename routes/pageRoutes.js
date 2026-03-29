const express = require("express");
const router  = express.Router();
const path    = require("path");

// Serve HTML pages
router.get("/leaderboard", (req, res) =>
    res.sendFile(path.join(__dirname, "../public", "leaderboard.html")));

router.get("/admin", (req, res) =>
    res.sendFile(path.join(__dirname, "../public", "admin.html")));

module.exports = router;
