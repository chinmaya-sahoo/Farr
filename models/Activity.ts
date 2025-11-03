// models/Activity.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// 1️⃣ Define interface
export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  exerciseType: string;
  duration: number;
  durationUnit: "minutes" | "hours" | "number";
  caloriesBurned: number;
  imageUrl?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 2️⃣ Schema
const ActivitySchema = new Schema<IActivity>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    exerciseType: { type: String, required: true },
    duration: { type: Number, required: true },
    durationUnit: { type: String, enum: ["minutes", "hours", "number"], required: true },
    caloriesBurned: { type: Number, default: 0 },
    imageUrl: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 3️⃣ Export model
export const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);
