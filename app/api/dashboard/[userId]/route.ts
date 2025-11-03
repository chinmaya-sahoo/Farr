import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { Activity } from "@/models/Activity";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";
import { ActivityType } from "@/types/activity";
import { User } from "@/models/User"; // assume we have User model for coins/badges

// Helper: calculate streaks
function calculateStreaks(activities: ActivityType[]) {
  const sorted = activities.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const completedDays = new Set<string>();
  for (const act of sorted) {
    completedDays.add(new Date(act.date).toDateString());
  }

  const dates = [...completedDays].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  let streak = 0;
  let maxStreak = 0;

  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      streak = 1;
      maxStreak = 1;
    } else {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) streak++;
      else streak = 1;

      maxStreak = Math.max(maxStreak, streak);
    }
  }

  return {
    currentStreak: streak,
    longestStreak: maxStreak,
    totalCompletedDays: completedDays.size,
  };
}

// Helper: calculate badges based on streak
function calculateBadges(streaks: { totalCompletedDays: number; longestStreak: number }) {
  const badges: string[] = [];

  if (streaks.totalCompletedDays >= 1) badges.push("Welcome Batch");
  if (streaks.totalCompletedDays >= 7) badges.push("Beginner Batch");
  if (streaks.totalCompletedDays >= 30) badges.push("Consistent Player Batch");
  if (streaks.longestStreak >= 30) badges.push("Monthly Batch");
  if (streaks.longestStreak >= 365) badges.push("Yearly Sports Freak Batch");

  return badges;
}

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.id !== userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    await connectToDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    // Fetch user activities
    const result = await Activity.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ date: -1 })
      .lean();

    const activities = result as unknown as ActivityType[];

    // Calculate streaks
    const streakData = calculateStreaks(activities);

    // Calculate badges
    const badges = calculateBadges(streakData);

    // Calculate total calories
    const totalCalories = activities.reduce(
      (sum, a) => sum + (a.caloriesBurned || 0),
      0
    );

    // Fetch user coins (from User model)
    const user = await User.findById(userId).lean();
    const coins = user?.coins || 0;

    return NextResponse.json({
      success: true,
      activities,
      ...streakData,
      totalCalories,
      badges,
      coins,
    });
  } catch (err) {
    console.error("❌ Error fetching dashboard:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
