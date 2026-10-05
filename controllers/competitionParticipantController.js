import CompetitionParticipant from "../models/CompetitionParticipant.js";
import Competition from "../models/Competition.js";
import Member from "../models/Member.js";
import { createNotification } from "../services/notificationService.js";
import { cleanEnum, cleanString } from "../utils/validation.js";

function cleanDocuments(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map((item) => cleanString(item, "Document", { max: 100 })))]
        .slice(0, 20);
}


export const getParticipants = async (req, res) => {
    try {
        const participants = await CompetitionParticipant.find()
            .populate("competition", "name date location")
            .populate("member", "name phone disciplines photo");

        res.status(200).json(participants);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};



export const getCompetitionParticipants = async (req, res) => {
    try {
        const participants = await CompetitionParticipant.find({
            competition: req.params.competitionId
        })
            .populate("member", "name phone disciplines photo");

        res.status(200).json(participants);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};



export const getParticipantById = async (req, res) => {
    try {
        const participant = await CompetitionParticipant.findById(
            req.params.id
        )
            .populate("competition", "name date location")
            .populate("member", "name phone disciplines photo");

        if (!participant) {
            return res.status(404).json({
                message: "Participant not found"
            });
        }

        res.status(200).json(participant);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


export const createParticipant = async (req, res) => {
    try {
        const {
            competition,
            member,
            competitionPayment,
            documentsStatus,
            incompleteDocuments
        } = req.body;

        const existingCompetition = await Competition.findById(
            competition
        );

        if (!existingCompetition) {
            return res.status(404).json({
                message: "Competition not found"
            });
        }

        const existingMember = await Member.findById(member);

        if (!existingMember) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        const existingParticipant = await CompetitionParticipant.findOne({
            competition,
            member,
        });

        if (existingParticipant) {
            return res.status(409).json({
                message: "This member is already registered for the competition",
            });
        }

        const participant = new CompetitionParticipant({
            competition,
            member,
            competitionPayment: cleanEnum(
                competitionPayment || "Unpaid",
                "Competition payment",
                ["Paid", "Unpaid"]
            ),
            documentsStatus: cleanEnum(
                documentsStatus || "Incomplete",
                "Documents status",
                ["Complete", "Incomplete"]
            ),
            incompleteDocuments:
                documentsStatus === "Complete"
                    ? []
                    : cleanDocuments(incompleteDocuments),
        });

        await participant.save();
        await participant.populate("competition", "name date location");
        await participant.populate("member", "name phone disciplines photo");

        // =========================
        // Incomplete Documents
        // =========================

        if (documentsStatus === "Incomplete") {
            const missingDocuments =
                incompleteDocuments?.length > 0
                    ? incompleteDocuments.join(", ")
                    : "Required documents";

            await createNotification({
                type: "documents_incomplete",
                title: "Incomplete Documents",
                message: `${existingMember.name} has incomplete documents for "${existingCompetition.name}". Missing: ${missingDocuments}.`,
            });
        }

        res.status(201).json({
            message: "Participant added successfully",
            participant
        });

    } catch (error) {
        console.error("Create participant error:", error);

        res.status(400).json({
            message: error.message
        });
    }
};

export const updateParticipant = async (req, res) => {
    try {
        const oldParticipant =
            await CompetitionParticipant.findById(req.params.id)
                .populate("member", "name")
                .populate("competition", "name");

        if (!oldParticipant) {
            return res.status(404).json({
                message: "Participant not found"
            });
        }

        const updateData = {
            competition: req.body.competition,
            member: req.body.member,
            competitionPayment: cleanEnum(
                req.body.competitionPayment,
                "Competition payment",
                ["Paid", "Unpaid"]
            ),
            documentsStatus: cleanEnum(
                req.body.documentsStatus,
                "Documents status",
                ["Complete", "Incomplete"]
            ),
            incompleteDocuments:
                req.body.documentsStatus === "Complete"
                    ? []
                    : cleanDocuments(req.body.incompleteDocuments),
        };

        const [existingCompetition, existingMember] = await Promise.all([
            Competition.findById(updateData.competition),
            Member.findById(updateData.member),
        ]);

        if (!existingCompetition || !existingMember) {
            return res.status(404).json({
                message: !existingCompetition
                    ? "Competition not found"
                    : "Member not found",
            });
        }

        const duplicate = await CompetitionParticipant.findOne({
            _id: { $ne: req.params.id },
            competition: updateData.competition,
            member: updateData.member,
        });

        if (duplicate) {
            return res.status(409).json({
                message: "This member is already registered for the competition",
            });
        }

        const participant =
            await CompetitionParticipant.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    returnDocument: "after",
                    runValidators: true
                }
            )
                .populate("competition", "name date location")
                .populate("member", "name phone disciplines photo");

        if (
            oldParticipant.documentsStatus !== "Incomplete" &&
            participant.documentsStatus === "Incomplete"
        ) {
            const missingDocuments =
                participant.incompleteDocuments?.length > 0
                    ? participant.incompleteDocuments.join(", ")
                    : "Required documents";

            await createNotification({
                type: "documents_incomplete",
                title: "Incomplete Documents",
                message: `${oldParticipant.member.name} has incomplete documents for "${oldParticipant.competition.name}". Missing: ${missingDocuments}.`,
            });
        }

        res.status(200).json({
            message: "Participant updated successfully",
            participant
        });

    } catch (error) {
        console.error("Update participant error:", error);

        res.status(400).json({
            message: error.message
        });
    }
};


export const deleteParticipant = async (req, res) => {
    try {
        const participant = await CompetitionParticipant.findByIdAndDelete(
            req.params.id
        );

        if (!participant) {
            return res.status(404).json({
                message: "Participant not found"
            });
        }

        res.status(200).json({
            message: "Participant removed successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
