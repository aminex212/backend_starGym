import express from "express";

import {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment
} from "../controllers/paymentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/api/payments", authMiddleware, getPayments);

router.get("/api/payments/:id", authMiddleware, getPaymentById);

router.post("/api/payments", authMiddleware, createPayment);

router.put("/api/payments/:id", authMiddleware, updatePayment);

router.delete("/api/payments/:id", authMiddleware, deletePayment);

export default router;