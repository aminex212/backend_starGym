import mongoose from "mongoose";
import MemberPhoto from "../models/MemberPhoto.js";

export const getMemberPhoto = async (req, res) => {
    const { memberId } = req.params;

    if (!mongoose.isValidObjectId(memberId)) {
        return res.status(400).json({ message: "Invalid member id" });
    }

    const photo = await MemberPhoto.findOne({ member: memberId }).lean();

    if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
    }

    res.set({
        "Content-Type": photo.contentType,
        "Cache-Control": "private, max-age=86400",
        ETag: `W/\"${photo.updatedAt.getTime()}-${photo.data.length}\"`,
    });
    return res.send(photo.data);
};
