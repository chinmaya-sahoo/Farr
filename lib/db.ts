// lib/db.ts
import mongoose from "mongoose";

// ✅ 1. Load connection string from environment
const MONGODB_URI = process.env.MONGODB_URI as string;

// ✅ 2. Safety check
if (!MONGODB_URI) {
  throw new Error("⚠️ Please define MONGODB_URI inside your .env.local file");
}

// ✅ 3. Define cache interface
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// ✅ 4. Mark this file as a module so global types work
export {};

// ✅ 5. Extend globalThis with our custom cache
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// ✅ 6. Initialize cache (reuse between hot reloads)
const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

// ✅ 7. The main connection function (safe, reusable)
export async function connectToDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => {
      console.log("✅ Connected to MongoDB");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // reset on failure
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }

  return cached.conn;
}
