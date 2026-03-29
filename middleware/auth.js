const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";

const adminAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (auth && auth === `Bearer ${ADMIN_PASS}`) return next();
    res.status(401).json({ error: "Unauthorized" });
};

module.exports = adminAuth;
