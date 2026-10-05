import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    month: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true,
        default: () => new Date().getFullYear(),
        min: 2000,
        max: 2100
    },
    status: {
        type: String,
        enum: ["Paid", "Unpaid"],
        default: "Unpaid"
    },
},
{
    timestamps: true
});

paymentSchema.index(
    { member: 1, month: 1, year: 1 },
    { unique: true }
);

export default mongoose.model("Payment", paymentSchema);
