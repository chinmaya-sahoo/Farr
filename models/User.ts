// models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// 1️⃣ Define the TypeScript interface for a User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  age: number;
  gender: "male" | "female" | "other";
  profileImage: string;
  coins: number;
  isBanned: boolean;
  role: "user" | "admin"; // ✅ added role
  createdAt: Date;
  updatedAt: Date;
}

// 2️⃣ Create the Mongoose schema
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    profileImage: { type: String, required: true },
    coins: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" }, // ✅ role field
  },
  { timestamps: true }
);

// 3️⃣ Prevent model overwrite in dev (Next.js hot reload)
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
