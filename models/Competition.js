import mongoose from "mongoose";

const competitionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true

    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
},
{
    timestamps: true
});

export default mongoose.model("Competition", competitionSchema);