import Payment from "../models/Payment.js";
import Member from "../models/Member.js";
import { createNotification } from "../services/notificationService.js";
import {
    cleanEnum,
    cleanNumber,
} from "../utils/validation.js";

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];


export const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate("member", "name phone disciplines")
            .sort({ year: -1, paymentDate: -1 })
            .lean();

        res.status(200).json(payments);
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
            status,
            year,
        } = req.body;

        const cleanMonth = cleanEnum(month, "Month", months);
        const cleanYear = cleanNumber(
            year || new Date(paymentDate || Date.now()).getFullYear(),
            "Year",
            { min: 2000, max: 2100 }
        );
        const cleanStatus = cleanEnum(status, "Status", ["Paid", "Unpaid"]);
        const cleanAmount = cleanNumber(amount, "Amount", { min: 0, max: 1000000 });

        const existingMember = await Member.findById(member);

        if (!existingMember) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        const existingPayment = await Payment.findOne({
            member,
            month: cleanMonth,
            year: cleanYear,
        });

        if (existingPayment) {
            return res.status(400).json({
                message: "Payment for this month already exists"
            });
        }

        const payment = new Payment({
            member,
            amount: cleanAmount,
            paymentDate,
            month: cleanMonth,
            year: cleanYear,
            status: cleanStatus,
        });

        await payment.save();

        // =========================
        // Create Notification
        // =========================

        if (cleanStatus === "Paid") {
            await createNotification({
                type: "payment_created",
                title: "Payment Received",
                message: `${existingMember.name} has paid ${cleanAmount} for ${cleanMonth} ${cleanYear}.`,
            });
        }

        if (cleanStatus === "Unpaid") {
            await createNotification({
                type: "payment_unpaid",
                title: "Payment Unpaid",
                message: `${existingMember.name} has an unpaid payment for ${cleanMonth} ${cleanYear}.`,
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
        const updateData = {
            amount: cleanNumber(req.body.amount, "Amount", { min: 0, max: 1000000 }),
            month: cleanEnum(req.body.month, "Month", months),
            year: cleanNumber(req.body.year, "Year", { min: 2000, max: 2100 }),
            paymentDate: req.body.paymentDate,
            status: cleanEnum(req.body.status, "Status", ["Paid", "Unpaid"]),
        };

        const duplicate = await Payment.findOne({
            _id: { $ne: id },
            member: oldPayment.member._id,
            month: updateData.month,
            year: updateData.year,
        });

        if (duplicate) {
            return res.status(409).json({
                message: "Payment for this month and year already exists",
            });
        }

        const payment = await Payment.findByIdAndUpdate(
            id,
            updateData,
            {
                returnDocument: "after",
                runValidators: true
            }
        ).populate("member", "name phone disciplines");

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
                message: `${oldPayment.member.name} has paid ${payment.amount} for ${payment.month} ${payment.year}.`,
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
                message: `${oldPayment.member.name} has an unpaid payment for ${payment.month} ${payment.year}.`,
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
