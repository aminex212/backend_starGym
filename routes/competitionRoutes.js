import express from "express";

import {
    getCompetitions,
    getCompetitionById,
    createCompetition,
    updateCompetition,
    deleteCompetition
} from "../controllers/competitionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/api/competitions", authMiddleware, getCompetitions);

router.get("/api/competitions/:id", authMiddleware, getCompetitionById);

router.post("/api/competitions", authMiddleware, createCompetition);

router.put("/api/competitions/:id", authMiddleware, updateCompetition);

router.delete("/api/competitions/:id", authMiddleware, deleteCompetition);

export default router;