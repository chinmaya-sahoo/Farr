// lib/auth.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("⚠️ Please define JWT_SECRET in your .env.local file");
}

export interface DecodedToken {
  id: string;
  email?: string;
  role?: "user" | "admin"; // ✅ add role property
  iat?: number;
  exp?: number;
}


// Generate a JWT token (for login/signup)
export function generateToken(payload: { id: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Verify a JWT token
export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    console.error("❌ Invalid or expired token:", error);
    return null;
  }
}
