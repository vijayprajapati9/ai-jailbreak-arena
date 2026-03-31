require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");

const { connectDB } = require("./config/db");
const pageRoutes    = require("./routes/pageRoutes");
const adminRoutes   = require("./routes/adminRoutes");
const teamRoutes    = require("./routes/teamRoutes");
const apiRoutes     = require("./routes/apiRoutes");
const chatRoutes    = require("./routes/chatRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/",      pageRoutes);
app.use("/admin", adminRoutes);
app.use("/team",  teamRoutes);
app.use("/api",   apiRoutes);
app.use("/chat",  chatRoutes);

connectDB()
    .then(() => {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`AI Jailbreak Arena running on http://localhost:${PORT}`);
            console.log(`Admin Panel: http://localhost:${PORT}/admin`);
            console.log(`Public Leaderboard: http://localhost:${PORT}/leaderboard`);
        });
    })
    .catch(err => {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    });