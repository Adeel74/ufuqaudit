import { NextResponse } from "next/server";
import { PLAN_TIERS } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ plans: PLAN_TIERS });
}
