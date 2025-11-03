import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { verifyToken, DecodedToken } from "@/lib/auth";
import mongoose from "mongoose";
import { User, IUser } from "@/models/User";
import { Activity } from "@/models/Activity";

// ✅ Type-safe lean version of IUser
type LeanUser = Omit<IUser, keyof mongoose.Document>;

// Request body types
interface AdminCoinRequestBody {
  action: "add" | "remove";
  amount: number;
  targetUserId?: string; // if undefined, apply to all users
}

interface AdminBanRequestBody {
  targetUserId: string;
  ban: boolean;
}

// ✅ Admin check middleware
async function isAdmin(token: string): Promise<boolean> {
  const decoded: DecodedToken | null = verifyToken(token);
  return decoded?.role === "admin";
}

// GET all users and stats
export async function GET(): Promise<NextResponse> {
  try {
    await connectToDB();

    const users: LeanUser[] = await User.find().select("-password").lean();

    // Daily user activity count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await Activity.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monthly user registration graph (last 12 months)
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const monthlyUsers = await User.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({ success: true, users, dailyActivity, monthlyUsers });
  } catch (err) {
    console.error("❌ Error fetching admin data:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Award or remove coins
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDB();

    const body: AdminCoinRequestBody = await req.json();
    const { action, amount, targetUserId } = body;

    if (amount <= 0)
      return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });

    if (targetUserId) {
      if (!mongoose.Types.ObjectId.isValid(targetUserId))
        return NextResponse.json({ error: "Invalid targetUserId" }, { status: 400 });

      const user = await User.findById(targetUserId);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      user.coins = action === "add" ? user.coins + amount : Math.max(0, user.coins - amount);
      await user.save();

      return NextResponse.json({ success: true, userId: targetUserId, coins: user.coins });
    } else {
      // Prevent negative coins for all users
      if (action === "remove") {
        await User.updateMany({}, [{ $set: { coins: { $max: [{ $subtract: ["$coins", amount] }, 0] } } }]);
      } else {
        await User.updateMany({}, { $inc: { coins: amount } });
      }

      return NextResponse.json({ success: true, message: "Coins updated for all users" });
    }
  } catch (err) {
    console.error("❌ Error updating coins:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH: Ban/Unban user
export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDB();

    const body: AdminBanRequestBody = await req.json();
    const { targetUserId, ban } = body;

    if (!mongoose.Types.ObjectId.isValid(targetUserId))
      return NextResponse.json({ error: "Invalid targetUserId" }, { status: 400 });

    const user = await User.findById(targetUserId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.isBanned = ban;
    await user.save();

    return NextResponse.json({ success: true, userId: targetUserId, banned: ban });
  } catch (err) {
    console.error("❌ Error banning user:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
