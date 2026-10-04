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
    status: {
        type: String,
        enum: ["Paid", "Unpaid"],
        default: "Unpaid"
    },
},
{
    timestamps: true
});

export default mongoose.model("Payment", paymentSchema);