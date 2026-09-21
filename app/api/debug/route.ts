import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const envStatus = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  let dbStatus = "Not tested";
  let dbError = null;
  
  if (process.env.DATABASE_URL) {
    try {
      // Just test connection
      await db.$queryRaw`SELECT 1`;
      dbStatus = "Connected";
    } catch (e: any) {
      dbStatus = "Failed";
      dbError = e.message;
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: envStatus,
    db: { status: dbStatus, error: dbError }
  });
}
