import { createNotification } from "../services/notificationService.js";
import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export const getMembers = async (req, res) => {
    try {
        const currentMonth = new Date().toLocaleString("en-US", {
            month: "long",
        });
        const currentYear = new Date().getFullYear();

        const members = await Member.find()
            .populate(
                "group",
                "name discipline days startTime endTime active"
            )
            .lean();

        const payments = await Payment.find({
            month: currentMonth,
            status: "Paid",
        }).select("member");

        const paidMemberIds = new Set(
            payments.map((payment) => payment.member.toString())
        );

        const membersWithPaymentStatus = members.map((member) => ({
            ...member,
            paymentStatus: paidMemberIds.has(member._id.toString())
                ? "Paid"
                : "Unpaid",
            insuranceStatus:
                member.insuranceStatus === "Paid" &&
                member.insuranceYear === currentYear
                    ? "Paid"
                    : "Unpaid",
        }));

        res.status(200).json(membersWithPaymentStatus);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getMemberById = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await Member.findById(id);

        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        res.status(200).json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const createMember = async (req, res) => {
    try {
        let photoPath = null;

        if (req.file) {
            const fileName = Date.now() + ".webp";

            const outputPath = path.join(
                "uploads",
                "images",
                fileName
            );

            await sharp(req.file.buffer)
                .resize({
                    width: 1200,
                    withoutEnlargement: true,
                })
                .webp({
                    quality: 80,
                })
                .toFile(outputPath);

            photoPath = outputPath.replaceAll("\\", "/");
        }

        let disciplines = req.body.disciplines;

        if (typeof disciplines === "string") {
            disciplines = JSON.parse(disciplines);
        }

        const member = new Member({
            name: req.body.name,
            phone: req.body.phone,
            age: req.body.age,
            disciplines: disciplines,
            group: req.body.group || null,
            photo: photoPath,
            insuranceStatus: req.body.insuranceStatus,
            insuranceYear:
                req.body.insuranceStatus === "Paid"
                    ? new Date().getFullYear()
                    : null,
        });

        await member.save();

        // Create notification + send email
        await createNotification({
            type: "member_created",
            title: "New Member Added",
            message: `A new member has been added: ${member.name}.`,
        });

        res.status(201).json({
            message: "Member created successfully",
            member: member,
        });

    } catch (error) {
        console.error("Create member error:", error);

        res.status(400).json({
            message: error.message,
        });
    }
};

export const updateMember = async (req, res) => {
    try {
        const { id } = req.params;

        let updateData = {
            name: req.body.name,
            phone: req.body.phone,
            age: req.body.age,
            disciplines: req.body.disciplines,
            group: req.body.group || null,
            status: req.body.status,
            paymentStatus: req.body.paymentStatus,
            insuranceStatus: req.body.insuranceStatus,
            insuranceYear:
                req.body.insuranceStatus === "Paid"
                    ? new Date().getFullYear()
                    : null,
        };

        if (typeof updateData.disciplines === "string") {
            updateData.disciplines = JSON.parse(updateData.disciplines);
        }

        if (req.file) {
            const fileName = Date.now() + ".webp";

            const outputPath = path.join(
                "uploads",
                "images",
                fileName
            );

            await sharp(req.file.buffer)
                .resize({
                    width: 1200,
                    withoutEnlargement: true,
                })
                .webp({
                    quality: 80,
                })
                .toFile(outputPath);

            updateData.photo = outputPath.replaceAll("\\", "/");
        }

        const member = await Member.findByIdAndUpdate(
            id,
            updateData,
            {
                returnDocument: "after",
                runValidators: true,
            }
        );

        if (!member) {
            return res.status(404).json({
                message: "Member not found",
            });
        }

        await member.populate(
            "group",
            "name discipline startTime endTime active"
        );

        const currentMonth = new Date().toLocaleString("en-US", {
            month: "long",
        });
        const currentYear = new Date().getFullYear();
        const currentMonthPayment = await Payment.findOne({
            member: member._id,
            month: currentMonth,
            status: "Paid",
        });
        const memberResponse = {
            ...member.toObject(),
            paymentStatus: currentMonthPayment ? "Paid" : "Unpaid",
            insuranceStatus:
                member.insuranceStatus === "Paid" &&
                member.insuranceYear === currentYear
                    ? "Paid"
                    : "Unpaid",
        };

        res.status(200).json({
            message: "Member updated successfully",
            member: memberResponse,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

export const deleteMember = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await Member.findByIdAndUpdate(
            id,
            { status: "Out" },
            { returnDocument: "after" }
        );

        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.status(200).json({
            message: "Member marked as out successfully",
            member: member
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}