import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_PASSWORD = process.env.JWT_SECRET || "123123";

export const userMiddleware = (req: Request, res: Response, next: NextFunction): void => {
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
        
        const decoded = jwt.verify(token, JWT_PASSWORD);
        
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
        req.userId = (decoded as JwtPayload).id;
        next();
    } catch (error) {
        console.error("Token verification error:", error);
        res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};