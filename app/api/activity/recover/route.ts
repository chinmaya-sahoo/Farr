import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { verifyToken, DecodedToken } from "@/lib/auth";
import mongoose from "mongoose";
import { User } from "@/models/User";
import { Activity, IActivity } from "@/models/Activity";

// Request body type
interface RecoverStreakBody {
  userId: string;
  daysToRecover: number; // number of missing days to recover
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: DecodedToken | null = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    await connectToDB();

    const body: RecoverStreakBody = await req.json();
    const { userId, daysToRecover } = body;

    if (decoded.id !== userId)
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });

    if (!mongoose.Types.ObjectId.isValid(userId))
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: "User is banned" }, { status: 403 });

    if (daysToRecover <= 0) return NextResponse.json({ error: "Invalid daysToRecover" }, { status: 400 });

    if (user.coins < daysToRecover)
      return NextResponse.json({ error: "Not enough coins", coins: user.coins }, { status: 400 });

    // Deduct coins
    user.coins -= daysToRecover;
    await user.save();

    // ✅ Add "recovered" activity entries for each missing day
    const lastActivity = await Activity.find({ userId }).sort({ date: -1 }).limit(1);
    const lastDate = lastActivity.length ? new Date(lastActivity[0].date) : new Date();

    const recoveredActivities: IActivity[] = [];
    for (let i = 1; i <= daysToRecover; i++) {
      const recoveredDate = new Date(lastDate);
      recoveredDate.setDate(lastDate.getDate() - i);
      const recovered = new Activity({
        userId: new mongoose.Types.ObjectId(userId),
        exerciseType: "Recovered Day",
        duration: 0,
        durationUnit: "number",
        caloriesBurned: 0,
        imageUrl: "",
        date: recoveredDate,
      } as IActivity);
      await recovered.save();
      recoveredActivities.push(recovered);
    }

    return NextResponse.json({
      success: true,
      coins: user.coins,
      recoveredDays: daysToRecover,
      recoveredActivities,
    });
  } catch (err) {
    console.error("❌ Error recovering streak:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
