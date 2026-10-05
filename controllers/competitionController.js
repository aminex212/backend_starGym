import Competition from "../models/Competition.js";
import { createNotification } from "../services/notificationService.js";
import CompetitionParticipant from "../models/CompetitionParticipant.js";
import { cleanString } from "../utils/validation.js";

function competitionData(body) {
    return {
        name: cleanString(body.name, "Name", { max: 150 }),
        date: body.date,
        location: cleanString(body.location, "Location", { max: 200 }),
        description: cleanString(body.description, "Description", {
            required: false,
            max: 2000,
        }) || "",
    };
}

export const getCompetitions = async (req, res) => {
    try {
        const competitions = await Competition.find();
        res.status(200).json(competitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }   
}


export const getCompetitionById = async (req, res) => {
    try {
        const { id } = req.params;
        const competition = await Competition.findById(id);

        if (!competition) {
            return res.status(404).json({ message: "Competition not found" });
        }

        res.status(200).json(competition);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const createCompetition = async (req, res) => {
    try {
        const competition = new Competition(competitionData(req.body));

        await competition.save();

        // =========================
        // Create Notification
        // =========================

        await createNotification({
            type: "competition_created",
            title: "New Competition",
            message: `Competition "${competition.name}" has been created.`,
        });

        res.status(201).json({
            message: "Competition created successfully",
            competition
        });

    } catch (error) {
        console.error("Create competition error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};

export const updateCompetition = async (req, res) => {
    try {
        const { id } = req.params;
        const competition = await Competition.findByIdAndUpdate(
            id,
            competitionData(req.body),
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!competition) {
            return res.status(404).json({ message: "Competition not found" });
        }

        res.status(200).json({
            message: "Competition updated successfully",
            competition
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteCompetition = async (req, res) => {
    try {
        const { id } = req.params;
        const competition = await Competition.findByIdAndDelete(id);

        if (!competition) {
            return res.status(404).json({ message: "Competition not found" });
        }

        await CompetitionParticipant.deleteMany({ competition: id });

        res.status(200).json({ message: "Competition deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
