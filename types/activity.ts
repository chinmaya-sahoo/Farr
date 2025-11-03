import mongoose from "mongoose";

export interface ActivityType {
  _id?: string;
  userId: mongoose.Types.ObjectId; // ✅ ObjectId type
  exerciseType: string;
  duration: number;
  durationUnit: string;
  imageUrl?: string;
  date: Date;
  caloriesBurned?: number;
}
