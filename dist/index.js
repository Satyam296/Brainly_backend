"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const utils_1 = require("./utils");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const middleware_1 = require("./middleware");
const cors_1 = __importDefault(require("cors"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const JWT_PASSWORD = process.env.JWT_SECRET || "123123";
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
// Zod schemas for validation
const signupSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(20),
    password: zod_1.z.string().min(6)
});
const signinSchema = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string()
});
const contentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    link: zod_1.z.string().min(1, "Link is required"),
    type: zod_1.z.enum(["twitter", "youtube", "instagram", "linkedin", "tiktok", "document", "link", "notes"])
});
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate input
        const { username, password } = signupSchema.parse(req.body);
        // Hash password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        // Create user
        yield db_1.UserModel.create({
            username: username,
            password: hashedPassword
        });
        return res.status(201).json({
            message: "User signed up"
        });
    }
    catch (e) {
        if (e.name === 'ZodError') {
            return res.status(400).json({
                message: "Invalid input",
                errors: e.errors
            });
        }
        if (e.code === 11000) {
            return res.status(409).json({
                message: "User already exists"
            });
        }
        console.error("Signup error:", e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate input
        const { username, password } = signinSchema.parse(req.body);
        // Find user
        const existingUser = yield db_1.UserModel.findOne({ username });
        if (!existingUser) {
            return res.status(401).json({
                message: "Incorrect credentials"
            });
        }
        // Compare password
        const isPasswordValid = yield bcryptjs_1.default.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Incorrect credentials"
            });
        }
        // Generate token
        const token = jsonwebtoken_1.default.sign({
            id: existingUser._id
        }, JWT_PASSWORD, { expiresIn: '7d' });
        return res.json({
            token,
            message: "Signed in successfully"
        });
    }
    catch (e) {
        if (e.name === 'ZodError') {
            return res.status(400).json({
                message: "Invalid input",
                errors: e.errors
            });
        }
        console.error("Signin error:", e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}));
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate input
        const { title, link, type } = contentSchema.parse(req.body);
        // Create content
        const content = yield db_1.ContentModel.create({
            title,
            link,
            type,
            //@ts-ignore
            userId: req.userId,
            tags: []
        });
        return res.status(201).json({
            message: "Content added",
            contentId: content._id
        });
    }
    catch (e) {
        if (e.name === 'ZodError') {
            return res.status(400).json({
                message: "Invalid input",
                errors: e.errors
            });
        }
        console.error("Content creation error:", e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}));
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const userId = req.userId;
        const content = yield db_1.ContentModel.find({
            userId: userId
        }).populate("userId", "username");
        return res.json({
            content
        });
    }
    catch (e) {
        console.error("Get content error:", e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}));
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contentId = req.body.contentId;
        if (!contentId) {
            return res.status(400).json({
                message: "Content ID is required"
            });
        }
        const result = yield db_1.ContentModel.deleteOne({
            _id: contentId,
            //@ts-ignore
            userId: req.userId
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Content not found"
            });
        }
        return res.json({
            message: "Content deleted successfully"
        });
    }
    catch (e) {
        console.error("Delete content error:", e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}));
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    if (share) {
        const existingLink = yield db_1.LinkModel.findOne({
            //@ts-ignore
            userId: req.userId
        });
        if (existingLink) {
            res.json({
                hash: existingLink.hash
            });
            return;
        }
        const hash = (0, utils_1.random)(10);
        yield db_1.LinkModel.create({
            //@ts-ignore
            userId: req.userId,
            hash: hash
        });
        res.json({
            hash
        });
    }
    else {
        yield db_1.LinkModel.deleteOne({
            //@ts-ignore
            userId: req.userId
        });
        res.json({
            message: "Removed link"
        });
    }
}));
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.shareLink;
    const link = yield db_1.LinkModel.findOne({
        hash
    });
    if (!link) {
        res.status(411).json({
            message: "Sorry incorrect input"
        });
        return;
    }
    // userId
    const content = yield db_1.ContentModel.find({
        userId: link.userId
    });
    console.log(link);
    const user = yield db_1.UserModel.findOne({
        _id: link.userId
    });
    if (!user) {
        res.status(411).json({
            message: "user not found, error should ideally not happen"
        });
        return;
    }
    res.json({
        username: user.username,
        content: content
    });
}));
// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
});
