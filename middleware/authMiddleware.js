import jwt from "jsonwebtoken";
import { SESSION_COOKIE, verifyCsrfToken } from "./sessionSecurity.js";

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7)
            : null;
        const cookieToken = req.cookies?.[SESSION_COOKIE];
        const token = cookieToken || bearerToken;

        if (!token) {
            return res.status(401).json({
                message: "Access denied. No token provided.",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin only.",
            });
        }

        if (
            cookieToken &&
            !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
            !verifyCsrfToken(req)
        ) {
            return res.status(403).json({
                message: "Invalid CSRF token.",
            });
        }

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token.",
        });
    }
};

export default authMiddleware;
