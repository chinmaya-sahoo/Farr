// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    // 1️⃣ Parse JSON body
    const { name, email, password, age, gender, profileImage } = await req.json();

    // 2️⃣ Validate input
    if (!name || !email || !password || !age || !gender || !profileImage) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // 3️⃣ Connect to database
    await connectToDB();

    // 4️⃣ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists." }, { status: 409 });
    }

    // 5️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      age,
      gender,
      profileImage,
      coins: 0,
      isBanned: false,
    });

    // 7️⃣ Return success response
    return NextResponse.json(
      { message: "User registered successfully!", userId: newUser._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json({ error: "Server error during registration." }, { status: 500 });
  }
}
