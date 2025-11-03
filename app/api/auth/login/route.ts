// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("⚠️ Please define JWT_SECRET in your .env.local file");
}

export async function POST(req: Request) {
  try {
    // 1️⃣ Parse request body
    const { email, password } = await req.json();

    // 2️⃣ Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // 3️⃣ Connect to DB
    await connectToDB();

    // 4️⃣ Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // 5️⃣ Check if user is banned
    if (user.isBanned) {
      return NextResponse.json({ error: "Your account has been banned." }, { status: 403 });
    }

    // 6️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // 7️⃣ Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 8️⃣ Return success with token
    return NextResponse.json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coins: user.coins,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json({ error: "Server error during login." }, { status: 500 });
  }
}
