// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET(req: Request) {
  try {
    // 1️⃣ Extract token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1]; // "Bearer <token>"

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // 2️⃣ Verify the token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // 3️⃣ Connect to database
    await connectToDB();

    // 4️⃣ Fetch user data
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 5️⃣ Respond with dashboard data
    return NextResponse.json({
      message: `Welcome back, ${user.name}!`,
      user,
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
