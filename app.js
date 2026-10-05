import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import memberRoutes from "./routes/memberRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import competitionRoutes from "./routes/competitionRoutes.js";
import competitionParticipantRoutes from "./routes/competitionParticipantRoutes.js";
import trainingGroupRoutes from "./routes/trainingGroupRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import memberPhotoRoutes from "./routes/memberPhotoRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";

const app = express();
const port = process.env.PORT || 8000;

const requiredEnvironment = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvironment = requiredEnvironment.filter(
    (name) => !process.env[name]
);

if (missingEnvironment.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvironment.join(", ")}`
    );
}

const allowedOrigins = new Set(
    [process.env.FRONTEND_URL, process.env.CORS_ORIGINS]
        .filter(Boolean)
        .flatMap((value) => value.split(","))
        .map((value) => value.trim().replace(/\/$/, ""))
);

if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://localhost:3001");
}

// Middleware
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);
app.use(
    cors({
        credentials: true,
        origin(origin, callback) {
            if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
                return callback(null, true);
            }

            return callback(new Error("Origin is not allowed by CORS"));
        },
    })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Uploads images
app.use("/uploads", authMiddleware, express.static("uploads"));

app.get("/api/health", (_req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;
    return res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? "ok" : "unavailable",
        database: databaseReady ? "connected" : "disconnected",
    });
});

app.use(
    "/api",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 500,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { message: "Too many requests. Please try again later." },
    })
);

// Routes
app.use(memberRoutes);
app.use(paymentRoutes);
app.use(competitionRoutes);
app.use(competitionParticipantRoutes);
app.use(trainingGroupRoutes);
app.use(authRoutes);
app.use(notificationRoutes);
app.use(memberPhotoRoutes);

app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            message: "Invalid JSON request body",
        });
    }

    if (error?.name === "CastError") {
        return res.status(400).json({ message: "Invalid identifier" });
    }

    if (error?.code === 11000) {
        return res.status(409).json({ message: "This record already exists" });
    }

    if (error?.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
    }

    if (error?.message === "Origin is not allowed by CORS") {
        return res.status(403).json({ message: error.message });
    }

    console.error("Unhandled request error:", error);
    return res.status(500).json({ message: "Internal server error" });
});

let server;

async function start() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("connected to database");

    server = app.listen(port, "0.0.0.0", () => {
        console.log(`Server is running on port ${port}`);
    });
}

async function shutdown(signal) {
    console.log(`${signal} received, shutting down`);
    server?.close();
    await mongoose.connection.close();
    process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

start().catch((error) => {
    console.error("Unable to start server:", error);
    process.exit(1);
});

export default app;
