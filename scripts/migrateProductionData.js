import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import sharp from "sharp";
import Member from "../models/Member.js";
import MemberPhoto from "../models/MemberPhoto.js";
import Payment from "../models/Payment.js";

await mongoose.connect(process.env.MONGODB_URI);

const payments = await Payment.find({ year: { $exists: false } });
for (const payment of payments) {
    payment.year = new Date(
        payment.paymentDate || payment.createdAt || Date.now()
    ).getFullYear();
    await payment.save();
}

let migratedPhotos = 0;
const members = await Member.find({
    photo: { $type: "string", $ne: null, $not: /^\/api\/member-photos\// },
});

for (const member of members) {
    const sourcePath = path.resolve(String(member.photo));

    try {
        await fs.access(sourcePath);
        const data = await sharp(sourcePath)
            .rotate()
            .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        await MemberPhoto.findOneAndUpdate(
            { member: member._id },
            { data, contentType: "image/webp" },
            { upsert: true, runValidators: true }
        );
        member.photo = `/api/member-photos/${member._id}`;
        await member.save();
        migratedPhotos += 1;
    } catch (error) {
        console.warn(`Skipped photo for member ${member._id}: ${error.message}`);
    }
}

console.log(
    `Migration complete: ${payments.length} payment years and ${migratedPhotos} photos migrated.`
);
await mongoose.disconnect();
