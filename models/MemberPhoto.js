import mongoose from "mongoose";

const memberPhotoSchema = new mongoose.Schema(
    {
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true,
            unique: true,
            index: true,
        },
        data: {
            type: Buffer,
            required: true,
        },
        contentType: {
            type: String,
            enum: ["image/webp"],
            default: "image/webp",
        },
    },
    { timestamps: true }
);

export default mongoose.model("MemberPhoto", memberPhotoSchema);
