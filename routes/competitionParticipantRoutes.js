import express from "express";

import {
    getParticipants,
    getCompetitionParticipants,
    getParticipantById,
    createParticipant,
    updateParticipant,
    deleteParticipant
} from "../controllers/competitionParticipantController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/api/competition-participants",
    authMiddleware,
    getParticipants
);

router.get(
    "/api/competitions/:competitionId/participants",
    authMiddleware,
    getCompetitionParticipants
);

router.get(
    "/api/competition-participants/:id",
    authMiddleware,
    getParticipantById
);

router.post(
    "/api/competition-participants",
    authMiddleware,
    createParticipant
);

router.put(
    "/api/competition-participants/:id",
    authMiddleware,
    updateParticipant
);

router.delete(
    "/api/competition-participants/:id",
    authMiddleware,
    deleteParticipant
);

export default router;