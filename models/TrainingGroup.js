import mongoose from "mongoose";

const trainingGroupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        discipline: {
            type: String,
            enum: [
                "MMA",
                "Kick Boxing",
                "Boxing",
                "Jiu-Jitsu",
                "Wrestling",
            ],
            required: true,
        },

        days: {
            type: [String],
            enum: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ],
            required: true,
            default: [],
        },

        startTime: {
            type: String,
            required: true,
        },

        endTime: {
            type: String,
            required: true,
        },

        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "TrainingGroup",
    trainingGroupSchema
);