import express from "express";
import { rateLimit } from "express-rate-limit";

import {
  login,
  updateProfile,
  forgotPassword,
  resetPassword,
  getSession,
  logout,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

router.post("/api/auth/login", authRateLimit, login);

router.post("/api/auth/forgot-password", authRateLimit, forgotPassword);

router.post("/api/auth/reset-password", authRateLimit, resetPassword);

router.get("/api/auth/session", authMiddleware, getSession);

router.post("/api/auth/logout", authMiddleware, logout);

router.put(
  "/api/auth/profile",
  authMiddleware,
  updateProfile
);

export default router;
