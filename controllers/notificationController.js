import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "../services/emailService.js";

export const sendTestEmail = async (req, res) => {
    try {
        const admin = await User.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found",
            });
        }

        if (!admin.email) {
            return res.status(400).json({
                message: "Admin email not found",
            });
        }

        await sendEmail({
            to: admin.email,
            subject: "StarGym - Test Email",
            html: `
                <h2>StarGym Fighting Academy</h2>
                <p>This is a test email from your StarGym dashboard.</p>
            `,
        });

        res.status(200).json({
            message: "Test email sent successfully",
            email: admin.email,
        });
    } catch (error) {
        console.error("Send test email error:", error);

        res.status(500).json({
            message: "Failed to send test email",
            error: error.message,
        });
    }
};


// GET notifications
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};


// Mark one notification as read
export const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndUpdate(
            id,
            { read: true },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};


// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { read: false },
            { $set: { read: true } }
        );

        res.status(200).json({
            message: "All notifications marked as read",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};


// Delete one notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        res.status(200).json({
            message: "Notification deleted",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};