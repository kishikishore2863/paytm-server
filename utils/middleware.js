const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const Auth = (req, res, next) => {
    const authHeaders = req.headers.authorization;


    if (!authHeaders || !authHeaders.startsWith("Bearer")) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    const token = authHeaders.split(" ")[1];
    

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

module.exports = { Auth };
