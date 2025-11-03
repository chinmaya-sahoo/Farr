// /app/api/activity/submit/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { verifyToken, DecodedToken } from "@/lib/auth";
import mongoose from "mongoose";
import { Activity, IActivity } from "@/models/Activity";
import { User } from "@/models/User";
import cloudinary from "cloudinary";

// ✅ Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Request body type
interface SubmitActivityBody {
  userId: string;
  exerciseType: string;
  duration: number;
  durationUnit: "minutes" | "hours" | "number";
  caloriesBurned?: number;
  imageUrl?: string;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: DecodedToken | null = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    await connectToDB();

    const body: SubmitActivityBody = await req.json();
    const { userId, exerciseType, duration, durationUnit, caloriesBurned, imageUrl } = body;

    if (decoded.id !== userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: "User is banned" }, { status: 403 });

    // ✅ Create new activity
    const newActivity = new Activity({
      userId: new mongoose.Types.ObjectId(userId),
      exerciseType,
      duration,
      durationUnit,
      caloriesBurned: caloriesBurned || 0,
      imageUrl: imageUrl || "",
      date: new Date(),
    } as IActivity);

    await newActivity.save();

    // ✅ Batch awards
    const completedDays = await Activity.find({ userId }).countDocuments();
    let awardedBatch: string | null = null;

    if (completedDays === 1) awardedBatch = "Welcome Batch";
    else if (completedDays === 7) awardedBatch = "Beginner Batch";
    else if (completedDays === 30) awardedBatch = "Consistent Player Batch";
    else if (completedDays % 30 === 0) awardedBatch = `Month ${completedDays / 30} Batch`;
    else if (completedDays === 365) awardedBatch = "Yearly Sports Freak Batch";

    return NextResponse.json({
      success: true,
      activity: newActivity,
      awardedBatch,
    });
  } catch (err) {
    console.error("❌ Error submitting activity:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
