import express from "express";

import {
    sendTestEmail,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/api/notifications/test-email",
    authMiddleware,
    sendTestEmail
);

router.get(
    "/api/notifications",
    authMiddleware,
    getNotifications
);

router.patch(
    "/api/notifications/:id/read",
    authMiddleware,
    markNotificationAsRead
);

router.patch(
    "/api/notifications/read-all",
    authMiddleware,
    markAllNotificationsAsRead
);

router.delete(
    "/api/notifications/:id",
    authMiddleware,
    deleteNotification
);

export default router;