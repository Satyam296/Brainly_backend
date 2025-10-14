import "dotenv/config";
import express, { Request, Response } from "express";
import { random } from "./utils";
import jwt from "jsonwebtoken";
import { ContentModel, LinkModel, UserModel } from "./db";
import { userMiddleware } from "./middleware";
import cors from "cors";
import bcrypt from "bcryptjs";
import { z } from "zod";

const JWT_PASSWORD = process.env.JWT_SECRET || "123123";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

// Zod schemas for validation
const signupSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(6)
});

const signinSchema = z.object({
    username: z.string(),
    password: z.string()
});

const contentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    link: z.string().min(1, "Link is required"),
    type: z.enum(["twitter", "youtube", "instagram", "linkedin", "tiktok", "document", "link", "notes"])
});

app.post("/api/v1/signup", async (req: Request, res: Response): Promise<any> => {
    try {
        // Validate input
        const { username, password } = signupSchema.parse(req.body);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        await UserModel.create({
            username: username,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "User signed up"
        });
    } catch(e: any) {
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
});

app.post("/api/v1/signin", async (req: Request, res: Response): Promise<any> => {
    try {
        // Validate input
        const { username, password } = signinSchema.parse(req.body);

        // Find user
        const existingUser = await UserModel.findOne({ username });
        
        if (!existingUser) {
            return res.status(401).json({
                message: "Incorrect credentials"
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, existingUser.password!);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Incorrect credentials"
            });
        }

        // Generate token
        const token = jwt.sign({
            id: existingUser._id
        }, JWT_PASSWORD, { expiresIn: '7d' });

        return res.json({
            token,
            message: "Signed in successfully"
        });
    } catch(e: any) {
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
});

app.post("/api/v1/content", userMiddleware, async (req: Request, res: Response): Promise<any> => {
    try {
        // Validate input
        const { title, link, type } = contentSchema.parse(req.body);

        // Create content
        const content = await ContentModel.create({
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
    } catch(e: any) {
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
});

app.get("/api/v1/content", userMiddleware, async (req: Request, res: Response): Promise<any> => {
    try {
        // @ts-ignore
        const userId = req.userId;
        
        const content = await ContentModel.find({
            userId: userId
        }).populate("userId", "username");

        return res.json({
            content
        });
    } catch(e: any) {
        console.error("Get content error:", e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.delete("/api/v1/content", userMiddleware, async (req: Request, res: Response): Promise<any> => {
    try {
        const contentId = req.body.contentId;

        if (!contentId) {
            return res.status(400).json({
                message: "Content ID is required"
            });
        }

        const result = await ContentModel.deleteOne({
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
    } catch(e: any) {
        console.error("Delete content error:", e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    const share = req.body.share;
    if (share) {
            const existingLink = await LinkModel.findOne({
                //@ts-ignore
                userId: req.userId
            });

            if (existingLink) {
                res.json({
                    hash: existingLink.hash
                })
                return;
            }
            const hash = random(10);
            await LinkModel.create({
                //@ts-ignore
                userId: req.userId,
                hash: hash
            })

            res.json({
                hash
            })
    } else {
        await LinkModel.deleteOne({
            //@ts-ignore
            userId: req.userId
        });

        res.json({
            message: "Removed link"
        })
    }
})

app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;

    const link = await LinkModel.findOne({
        hash
    });

    if (!link) {
        res.status(411).json({
            message: "Sorry incorrect input"
        })
        return;
    }
    // userId
    const content = await ContentModel.find({
        userId: link.userId
    })

    console.log(link);
    const user = await UserModel.findOne({
        _id: link.userId
    })

    if (!user) {
        res.status(411).json({
            message: "user not found, error should ideally not happen"
        })
        return;
    }

    res.json({
        username: user.username,
        content: content
    })

})

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
});