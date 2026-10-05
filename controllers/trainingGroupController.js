import TrainingGroup from "../models/TrainingGroup.js";
import Member from "../models/Member.js";
import {
    cleanEnum,
    cleanString,
    cleanStringArray,
} from "../utils/validation.js";

const disciplines = ["MMA", "Kick Boxing", "Boxing", "Jiu-Jitsu", "Wrestling"];
const weekDays = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday",
];

function trainingGroupData(body) {
    return {
        name: cleanString(body.name, "Name", { max: 100 }),
        discipline: cleanEnum(body.discipline, "Discipline", disciplines),
        days: cleanStringArray(body.days, "Days", weekDays, { min: 1 }),
        startTime: cleanString(body.startTime, "Start time", { max: 5 }),
        endTime: cleanString(body.endTime, "End time", { max: 5 }),
        active: body.active !== false,
    };
}


export const getTrainingGroups = async (req, res) => {
    try {
        const groups = await TrainingGroup.find().sort({
            startTime: 1,
        });

        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};


export const getTrainingGroupById = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await TrainingGroup.findById(id);

        if (!group) {
            return res.status(404).json({
                message: "Training group not found",
            });
        }

        res.status(200).json(group);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};


export const createTrainingGroup = async (req, res) => {
    try {
        const group = new TrainingGroup(trainingGroupData(req.body));

        await group.save();

        res.status(201).json({
            message: "Training group created successfully",
            group,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};


export const updateTrainingGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await TrainingGroup.findByIdAndUpdate(
            id,
            trainingGroupData(req.body),
            {
                returnDocument: "after",
                runValidators: true,
            }
        );

        if (!group) {
            return res.status(404).json({
                message: "Training group not found",
            });
        }

        res.status(200).json({
            message: "Training group updated successfully",
            group,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};


export const deleteTrainingGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await TrainingGroup.findById(id);

        if (!group) {
            return res.status(404).json({
                message: "Training group not found",
            });
        }

        // Remove the group assignment from all members
        await Member.updateMany(
            { group: id },
            { $set: { group: null } }
        );

        // Delete the group
        await TrainingGroup.findByIdAndDelete(id);

        res.status(200).json({
            message: "Training group deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};
