import express from "express";

import {
  login,
  updateProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/api/auth/login", login);

router.post("/api/auth/forgot-password", forgotPassword);

router.post("/api/auth/reset-password", resetPassword);

router.put(
  "/api/auth/profile",
  authMiddleware,
  updateProfile
);

export default router;