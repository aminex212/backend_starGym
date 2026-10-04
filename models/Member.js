import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    disciplines: {
        type: [String],
        enum: ["MMA", "Kick Boxing", "Boxing", "Wrestling", "Jiu-Jitsu"],
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TrainingGroup",
        default: null,
    },
    photo: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ["Active", "Out"],
        default: "Active"
    },
    paymentStatus: {
        type: String,
        enum: ["Paid", "Unpaid"],
        default: "Unpaid"
    },
    insuranceStatus: {
        type: String,
        enum: ["Paid", "Unpaid"],
        default: "Unpaid"
    },
    insuranceYear: {
        type: Number,
        default: null
    }
},
{ 
    timestamps: true 
});

export default mongoose.model("Member", memberSchema);