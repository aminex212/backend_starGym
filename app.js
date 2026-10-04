import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";
import memberRoutes from "./routes/memberRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import competitionRoutes from "./routes/competitionRoutes.js";
import competitionParticipantRoutes from "./routes/competitionParticipantRoutes.js";
import trainingGroupRoutes from "./routes/trainingGroupRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Uploads images
app.use("/uploads", express.static("uploads"));

// Connect to mongodb 
mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;

db.on("error", () => {
    console.log("error in connecting to database");
});

db.once("open", () => {
    console.log("connected to database");
});

// Routes
app.use(memberRoutes);
app.use(paymentRoutes);
app.use(competitionRoutes);
app.use(competitionParticipantRoutes);
app.use(trainingGroupRoutes);
app.use(authRoutes);
app.use(notificationRoutes);

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            message: "Invalid JSON request body",
        });
    }

    next(error);
});

app.listen(port, () => {
    console.log(`Server is runing on port ${port}`);
});