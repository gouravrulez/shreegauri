import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    preview_only: process.env.VERCEL_ENV !== "production",
    environment: process.env.VERCEL_ENV || "development",
  }, { headers: { "Cache-Control": "no-store" } });
}
