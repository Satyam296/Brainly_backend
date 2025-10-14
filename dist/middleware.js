"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_PASSWORD = process.env.JWT_SECRET || "123123";
const userMiddleware = (req, res, next) => {
    try {
        const header = req.headers["authorization"];
        if (!header) {
            res.status(401).json({
                message: "Authorization header is required"
            });
            return;
        }
        // Remove 'Bearer ' prefix if present
        const token = header.startsWith('Bearer ') ? header.slice(7) : header;
        const decoded = jsonwebtoken_1.default.verify(token, JWT_PASSWORD);
        if (!decoded) {
            res.status(403).json({
                message: "Invalid token"
            });
            return;
        }
        if (typeof decoded === "string") {
            res.status(403).json({
                message: "Invalid token format"
            });
            return;
        }
        //@ts-ignore 
        req.userId = decoded.id;
        next();
    }
    catch (error) {
        console.error("Token verification error:", error);
        res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};
exports.userMiddleware = userMiddleware;
