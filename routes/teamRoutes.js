const express = require("express");
const router  = express.Router();
const { loginTeam, startTeam } = require("../controllers/teamController");

router.post("/login", loginTeam);
router.post("/start", startTeam);

module.exports = router;
