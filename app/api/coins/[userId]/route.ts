import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";
import { User } from "@/models/User"; // make sure coins field exists in User model

interface CoinRequestBody {
  action: "add" | "remove" | "spend";
  amount: number;
}

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const body: CoinRequestBody = await req.json();
    const { action, amount } = body;

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case "add":
        user.coins = (user.coins || 0) + amount;
        break;
      case "remove":
        user.coins = Math.max(0, (user.coins || 0) - amount);
        break;
      case "spend":
        if ((user.coins || 0) < amount) {
          return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
        }
        user.coins -= amount;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await user.save();

    return NextResponse.json({ success: true, coins: user.coins });
  } catch (err) {
    console.error("❌ Error updating coins:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
