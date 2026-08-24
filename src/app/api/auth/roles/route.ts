// GET /api/auth/roles — list all roles and permissions
import { NextResponse } from "next/server";
import { ROLES } from "@/lib/auth";

export async function GET() {
  const roles = Object.entries(ROLES).map(([key, def]) => ({
    key,
    label: def.label,
    description: def.description,
    permissions: def.permissions,
  }));

  return NextResponse.json({ roles });
}
