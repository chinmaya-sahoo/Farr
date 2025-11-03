import { connectToDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();
    return NextResponse.json({ message: "✅ MongoDB connection successful!" });
  } catch (error) {
    return NextResponse.json({ error: "❌ MongoDB connection failed" }, { status: 500 });
  }
}
