import TrainingGroup from "../models/TrainingGroup.js";
import Member from "../models/Member.js";


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
        const {
            name,
            discipline,
            days,
            startTime,
            endTime,
            active,
        } = req.body;

        const group = new TrainingGroup({
            name,
            discipline,
            days,
            startTime,
            endTime,
            active,
        });

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
            req.body,
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