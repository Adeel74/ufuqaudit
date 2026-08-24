// Auth library — password hashing, session management, RBAC
import { db } from "./db";
import crypto from "crypto";

// --- Password hashing (using Node crypto scryptSync — no bcrypt dependency needed) ---
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verifyHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === verifyHash;
}

// --- Session token generation ---
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string, req?: Request): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const userAgent = req?.headers.get("user-agent") || null;
  const ipAddress = req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

  await db.session.create({
    data: { userId, token, userAgent, ipAddress, expiresAt },
  });
  return token;
}

export async function getSession(token: string) {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }
  return session;
}

export async function deleteSession(token: string): Promise<void> {
  try { await db.session.delete({ where: { token } }); } catch {}
}

// --- Auth helpers ---
export async function getCurrentUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cookie = req.headers.get("cookie") || "";
  const token = authHeader?.replace("Bearer ", "") || cookie.match(/ufuq_session=([^;]+)/)?.[1];
  if (!token) return null;
  const session = await getSession(token);
  return session?.user ?? null;
}

// --- RBAC: Role definitions ---
export const ROLES = {
  super_admin: {
    label: "Super Admin",
    description: "Full platform access — can manage everything",
    permissions: ["*"],
  },
  admin: {
    label: "Admin",
    description: "Manage users, orgs, plans, billing, system",
    permissions: ["users.*", "orgs.*", "plans.*", "subs.*", "billing.*", "audits.*", "api.*", "system.*", "content.*"],
  },
  manager: {
    label: "Manager",
    description: "Manage projects, audits, team members",
    permissions: ["projects.*", "audits.*", "reports.*", "keywords.*", "backlinks.*", "team.view", "team.invite"],
  },
  editor: {
    label: "Editor",
    description: "Edit content, run audits, view reports",
    permissions: ["projects.view", "audits.run", "audits.view", "content.*", "reports.view"],
  },
  developer: {
    label: "Developer",
    description: "API access, crawl settings, technical SEO",
    permissions: ["api.*", "projects.view", "audits.run", "audits.view", "tools.*"],
  },
  user: {
    label: "User",
    description: "View audits and reports",
    permissions: ["projects.view", "audits.view", "reports.view"],
  },
} as const;

export type RoleKey = keyof typeof ROLES;

export function hasPermission(role: string, permission: string): boolean {
  const roleDef = (ROLES as any)[role];
  if (!roleDef) return false;
  if (roleDef.permissions.includes("*")) return true;
  // Check exact match or wildcard (e.g. "users.*" matches "users.create")
  return roleDef.permissions.some((p: string) => {
    if (p === permission) return true;
    if (p.endsWith(".*")) {
      const prefix = p.slice(0, -2);
      return permission.startsWith(prefix + ".");
    }
    return false;
  });
}

export function canAccessAdmin(role: string): boolean {
  return role === "super_admin" || role === "admin";
}

// --- User creation helper ---
export async function createUser(email: string, password: string, name?: string, role: string = "user", plan: string = "free") {
  const passwordHash = hashPassword(password);
  const user = await db.user.create({
    data: { email, name, passwordHash, role, plan, status: "active" },
  });
  return user;
}

export async function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}
