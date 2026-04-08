const express = require("express");
const router  = express.Router();
const path    = require("path");

router.get("/", (req, res) => {
  res.send("AI Jailbreak Arena is live 🚀");
});

router.get("/leaderboard", (req, res) =>
    res.sendFile(path.join(__dirname, "../public", "leaderboard.html")));

router.get("/admin", (req, res) =>
    res.sendFile(path.join(__dirname, "../public", "admin.html")));

module.exports = router;
