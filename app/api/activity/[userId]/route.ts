import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { verifyToken, DecodedToken } from "@/lib/auth";
import mongoose from "mongoose";
import { Activity, IActivity } from "@/models/Activity";
import { User } from "@/models/User";

// ✅ Calculate streaks
function calculateStreaks(activities: IActivity[]) {
  const sorted = activities
    .map(a => ({ ...a, date: new Date(a.date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const completedDays = new Set<string>();
  for (const act of sorted) completedDays.add(act.date.toDateString());

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

      streak = diff === 1 ? streak + 1 : 1;
      maxStreak = Math.max(maxStreak, streak);
    }
  }

  return {
    currentStreak: streak,
    longestStreak: maxStreak,
    totalCompletedDays: completedDays.size,
    missingDays: dates.length > 0 ? dates.length - streak : 0,
  };
}

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: DecodedToken | null = verifyToken(token);
    if (!decoded || decoded.id !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectToDB();

    if (!mongoose.Types.ObjectId.isValid(userId))
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: "User is banned" }, { status: 403 });

    // ✅ Fetch activities
    const activities: IActivity[] = await Activity.find({ userId }).sort({ date: -1 });

    // ✅ Calculate streaks
    const streakData = calculateStreaks(activities);

    // ✅ Total calories burned
    const totalCalories = activities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);

    // ✅ Batch awards
    const completedDays = streakData.totalCompletedDays;
    let awardedBatch: string | null = null;

    if (completedDays === 1) awardedBatch = "Welcome Batch";
    else if (completedDays === 7) awardedBatch = "Beginner Batch";
    else if (completedDays === 30) awardedBatch = "Consistent Player Batch";
    else if (completedDays % 30 === 0) awardedBatch = `Month ${completedDays / 30} Batch`;
    else if (completedDays === 365) awardedBatch = "Yearly Sports Freak Batch";

    // ✅ Coin system suggestion (user can recover missing days)
    const coinsNeededToRecover = streakData.missingDays; // 1 coin per missing day
    const canRecover = user.coins >= coinsNeededToRecover;

    return NextResponse.json({
      success: true,
      activities,
      totalCalories,
      ...streakData,
      awardedBatch,
      coins: user.coins,
      canRecover,
      coinsNeededToRecover,
    });
  } catch (err) {
    console.error("❌ Error fetching dashboard:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
