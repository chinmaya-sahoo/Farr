import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Activity } from "@/models/Activity";
import { User } from "@/models/User";

export async function GET(req: Request) {
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

    // Fetch user activities
    const activities = await Activity.find({ userId }).sort({ date: -1 }).lean();

    // Calculate streaks
    const dates = activities.map(a => new Date(a.date).toDateString());
    const uniqueDays = [...new Set(dates)];

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;

    for (let i = 0; i < uniqueDays.length; i++) {
      const day = new Date(uniqueDays[i]);
      const prev = new Date(day);
      prev.setDate(prev.getDate() - 1);

      if (uniqueDays.includes(prev.toDateString())) {
        streak++;
      } else {
        streak = 1;
      }
      longestStreak = Math.max(longestStreak, streak);
    }

    currentStreak = streak;
    const totalCompletedDays = uniqueDays.length;
    const totalCalories = activities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);

    return NextResponse.json({
      activities,
      currentStreak,
      longestStreak,
      totalCompletedDays,
      totalCalories,
    });
  } catch (err) {
    console.error("❌ Error in /api/activity/me:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
