import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "./emailService.js";

export const createNotification = async ({
    type,
    title,
    message,
}) => {
    try {
        // =========================
        // Save notification
        // =========================

        const notification = await Notification.create({
            type,
            title,
            message,
        });

        // =========================
        // Send email
        // =========================

        try {
            const admin = await User.findOne({ role: "admin" });

            if (admin?.email) {
                await sendEmail({
                    to: admin.email,
                    subject: `StarGym - ${title}`,
                    html: `
                        <div style="font-family: Arial, sans-serif;">
                            <h2>StarGym Fighting Academy</h2>
                            <h3>${title}</h3>
                            <p>${message}</p>
                        </div>
                    `,
                });
            }
        } catch (emailError) {
            // Email failure should NOT break the main operation
            console.error(
                "Notification email error:",
                emailError.message
            );
        }

        return notification;

    } catch (error) {
        console.error(
            "Create notification error:",
            error.message
        );

        throw error;
    }
};