import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import { cleanEmail, cleanString } from "../utils/validation.js";

const name = cleanString(process.env.ADMIN_NAME, "ADMIN_NAME", { max: 100 });
const email = cleanEmail(process.env.ADMIN_EMAIL);
const password = cleanString(process.env.ADMIN_PASSWORD, "ADMIN_PASSWORD", {
    max: 128,
});

if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters");
}

await mongoose.connect(process.env.MONGODB_URI);

const passwordHash = await bcrypt.hash(password, 12);
await User.findOneAndUpdate(
    { email },
    { name, email, password: passwordHash, role: "admin" },
    { upsert: true, runValidators: true }
);

console.log(`Admin account is ready for ${email}`);
await mongoose.disconnect();
