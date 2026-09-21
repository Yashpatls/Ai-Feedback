import { NextResponse } from "next/server";

export async function GET() {
  const envStatus = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: envStatus,
    db: { status: "Prisma removed for debugging", error: null }
  });
}
