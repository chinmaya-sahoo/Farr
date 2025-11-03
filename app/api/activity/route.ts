// app/api/activity/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Activity } from "@/models/Activity";

export async function POST(req: Request) {
  try {
    // 1️⃣ Extract token from header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // 2️⃣ Verify user
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // 3️⃣ Get activity data from request
    const { type, duration, imageUrl } = await req.json();

    if (!type || !duration) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 4️⃣ Connect DB
    await connectToDB();

    // 5️⃣ Create new activity
    const activity = await Activity.create({
      userId: decoded.id,
      type,
      duration,
      imageUrl,
    });

    return NextResponse.json(
      { message: "✅ Activity logged successfully!", activity },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error logging activity:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
