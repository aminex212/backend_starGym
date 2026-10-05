import { createNotification } from "../services/notificationService.js";
import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import MemberPhoto from "../models/MemberPhoto.js";
import sharp from "sharp";
import {
    cleanEnum,
    cleanNumber,
    cleanString,
    cleanStringArray,
} from "../utils/validation.js";

const disciplinesAllowed = [
    "MMA",
    "Kick Boxing",
    "Boxing",
    "Wrestling",
    "Jiu-Jitsu",
];

async function preparePhoto(file) {
    if (!file) return null;

    return sharp(file.buffer)
        .rotate()
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
}

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
            year: currentYear,
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
        let disciplines = req.body.disciplines;

        if (typeof disciplines === "string") {
            disciplines = JSON.parse(disciplines);
        }

        disciplines = cleanStringArray(
            disciplines,
            "Disciplines",
            disciplinesAllowed,
            { min: 1 }
        );
        const insuranceStatus = cleanEnum(
            req.body.insuranceStatus || "Unpaid",
            "Insurance status",
            ["Paid", "Unpaid"]
        );
        const photoData = await preparePhoto(req.file);

        const member = new Member({
            name: cleanString(req.body.name, "Name", { max: 100 }),
            phone: cleanString(req.body.phone, "Phone", { max: 30 }),
            age: cleanNumber(req.body.age, "Age", { min: 5, max: 100 }),
            disciplines,
            group: req.body.group || null,
            photo: null,
            insuranceStatus,
            insuranceYear:
                insuranceStatus === "Paid"
                    ? new Date().getFullYear()
                    : null,
        });

        await member.save();

        if (photoData) {
            await MemberPhoto.create({
                member: member._id,
                data: photoData,
                contentType: "image/webp",
            });
            member.photo = `/api/member-photos/${member._id}`;
            await member.save();
        }

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

        let disciplines = req.body.disciplines;

        if (typeof disciplines === "string") {
            disciplines = JSON.parse(disciplines);
        }

        const insuranceStatus = cleanEnum(
            req.body.insuranceStatus,
            "Insurance status",
            ["Paid", "Unpaid"]
        );
        const updateData = {
            name: cleanString(req.body.name, "Name", { max: 100 }),
            phone: cleanString(req.body.phone, "Phone", { max: 30 }),
            age: cleanNumber(req.body.age, "Age", { min: 5, max: 100 }),
            disciplines: cleanStringArray(
                disciplines,
                "Disciplines",
                disciplinesAllowed,
                { min: 1 }
            ),
            group: req.body.group || null,
            status: cleanEnum(req.body.status, "Status", ["Active", "Out"]),
            insuranceStatus,
            insuranceYear:
                insuranceStatus === "Paid"
                    ? new Date().getFullYear()
                    : null,
        };

        const photoData = await preparePhoto(req.file);
        if (photoData) updateData.photo = `/api/member-photos/${id}`;

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

        if (photoData) {
            await MemberPhoto.findOneAndUpdate(
                { member: member._id },
                { data: photoData, contentType: "image/webp" },
                { upsert: true, runValidators: true }
            );
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
            year: currentYear,
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
