import CompetitionParticipant from "../models/CompetitionParticipant.js";
import Competition from "../models/Competition.js";
import Member from "../models/Member.js";
import { createNotification } from "../services/notificationService.js";


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

        const participant = new CompetitionParticipant({
            competition,
            member,
            competitionPayment,
            documentsStatus,
            incompleteDocuments
        });

        await participant.save();

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

        const participant =
            await CompetitionParticipant.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    returnDocument: "after",
                    runValidators: true
                }
            );

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