import express from "express";
import { 
    createMember,
    deleteMember,
    getMemberById,
    getMembers, 
    updateMember
} from "../controllers/memberController.js";
import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/api/members", authMiddleware, getMembers);

router.get("/api/members/:id", authMiddleware, getMemberById);

router.post("/api/members", authMiddleware, upload.single("photo"), createMember);

router.put("/api/members/:id", authMiddleware, upload.single("photo"), updateMember);

router.delete("/api/members/:id", authMiddleware, deleteMember);

export default router;