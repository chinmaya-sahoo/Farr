import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Activity } from "@/models/Activity";
import { User } from "@/models/User";

// ✅ GET — Fetch all activities (admin or debug)
export async function GET() {
  try {
    await connectToDB();

    const activities = await Activity.find().populate("userId", "name email").sort({ date: -1 }).lean();

    return NextResponse.json({ success: true, activities });
  } catch (err) {
    console.error("❌ Error fetching activities:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ POST — Create new activity
export async function POST(req: Request) {
  try {
    await connectToDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const userId = decoded.id;
    const body = await req.json();

    const { exerciseType, duration, durationUnit, caloriesBurned, date, imageUrl } = body;

    if (!exerciseType || !duration || !durationUnit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newActivity = new Activity({
      userId,
      exerciseType,
      duration,
      durationUnit,
      caloriesBurned,
      date: date ? new Date(date) : new Date(),
      imageUrl,
    });

    await newActivity.save();

    // ✅ Optionally increment user coins or XP
    await User.findByIdAndUpdate(userId, { $inc: { coins: 5 } });

    return NextResponse.json({ success: true, activity: newActivity });
  } catch (err) {
    console.error("❌ Error creating activity:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
