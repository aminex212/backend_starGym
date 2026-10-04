import mongoose from "mongoose";

const competitionParticipantSchema = new mongoose.Schema({
    competition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Competition",
        required: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true
    },
    competitionPayment: {
        type: String,
        enum: ["Paid", "Unpaid"],
        default: "Unpaid"
    },
    documentsStatus: {
        type: String,
        enum: ["Complete", "Incomplete"],
        default: "Incomplete"
    },
    incompleteDocuments: {
        type: [String],
        default: []
    }
},
{
    timestamps: true
});

export default mongoose.model("CompetitionParticipant", competitionParticipantSchema);