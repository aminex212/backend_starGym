import Payment from "../models/Payment.js";
import Member from "../models/Member.js";
import { createNotification } from "../services/notificationService.js";


export const getPayments = async (req, res) => {
    try {
        const currentMonth = new Date().toLocaleString("en-US", {
            month: "long",
        });

        const payments = await Payment.find()
            .populate("member", "name phone disciplines")
            .lean();

        const paymentsWithCurrentStatus = payments.map((payment) => ({
            ...payment,
            status:
                payment.status === "Paid" && payment.month === currentMonth
                    ? "Paid"
                    : "Unpaid",
        }));

        res.status(200).json(paymentsWithCurrentStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id)
            .populate("member", "name phone disciplines");

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const createPayment = async (req, res) => {
    try {
        const {
            member,
            amount,
            paymentDate,
            month,
            status
        } = req.body;

        const existingMember = await Member.findById(member);

        if (!existingMember) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        const existingPayment = await Payment.findOne({
            member,
            month
        });

        if (existingPayment) {
            return res.status(400).json({
                message: "Payment for this month already exists"
            });
        }

        const payment = new Payment({
            member,
            amount,
            paymentDate,
            month,
            status
        });

        await payment.save();

        // =========================
        // Create Notification
        // =========================

        if (status === "Paid") {
            await createNotification({
                type: "payment_created",
                title: "Payment Received",
                message: `${existingMember.name} has paid ${amount} for ${month}.`,
            });
        }

        if (status === "Unpaid") {
            await createNotification({
                type: "payment_unpaid",
                title: "Payment Unpaid",
                message: `${existingMember.name} has an unpaid payment for ${month}.`,
            });
        }

        res.status(201).json({
            message: "Payment created successfully",
            payment
        });

    } catch (error) {
        console.error("Create payment error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


export const updatePayment = async (req, res) => {
    try {
        const { id } = req.params;

        // Get payment before update
        const oldPayment = await Payment.findById(id).populate(
            "member",
            "name"
        );

        if (!oldPayment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        // Update payment
        const payment = await Payment.findByIdAndUpdate(
            id,
            req.body,
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        // =========================
        // Payment became Paid
        // =========================

        if (
            oldPayment.status !== "Paid" &&
            payment.status === "Paid"
        ) {
            await createNotification({
                type: "payment_created",
                title: "Payment Received",
                message: `${oldPayment.member.name} has paid ${payment.amount} for ${payment.month}.`,
            });
        }

        // =========================
        // Payment became Unpaid
        // =========================

        if (
            oldPayment.status !== "Unpaid" &&
            payment.status === "Unpaid"
        ) {
            await createNotification({
                type: "payment_unpaid",
                title: "Payment Unpaid",
                message: `${oldPayment.member.name} has an unpaid payment for ${payment.month}.`,
            });
        }

        res.status(200).json({
            message: "Payment updated successfully",
            payment
        });

    } catch (error) {
        console.error("Update payment error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


export const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findByIdAndDelete(id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.status(200).json({ message: "Payment deleted successfully"});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}