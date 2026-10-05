import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getMemberPhoto } from "../controllers/memberPhotoController.js";

const router = express.Router();

router.get("/api/member-photos/:memberId", authMiddleware, getMemberPhoto);

export default router;
