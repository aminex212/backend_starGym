import express from "express";

import {
    getTrainingGroups,
    getTrainingGroupById,
    createTrainingGroup,
    updateTrainingGroup,
    deleteTrainingGroup,
} from "../controllers/trainingGroupController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/api/training-groups",
    authMiddleware,
    getTrainingGroups
);

router.get(
    "/api/training-groups/:id",
    authMiddleware,
    getTrainingGroupById
);

router.post(
    "/api/training-groups",
    authMiddleware,
    createTrainingGroup
);

router.put(
    "/api/training-groups/:id",
    authMiddleware,
    updateTrainingGroup
);

router.delete(
    "/api/training-groups/:id",
    authMiddleware,
    deleteTrainingGroup
);

export default router;