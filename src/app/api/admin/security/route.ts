// GET /api/admin/security — security center dashboard
import { NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function GET() {
  // Failed login attempts (last 30 days, daily)
  const failedLogins = Array.from({ length: 30 }, (_, i) => {
    const seed = hashStr("fl_" + i);
    return {
      date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      attempts: 5 + (seed % 40),
      uniqueIps: 2 + (seed % 12),
    };
  });

  // Suspicious activity
  const suspiciousActivity = [
    { id: "sa_1", type: "Multiple failed logins", user: "unknown@example.com", ip: "193.45.12.89", country: "Russia", attempts: 12, timestamp: new Date(Date.now() - 3600000).toISOString(), severity: "high" },
    { id: "sa_2", type: "Login from new location", user: "sarah@northwind.agency", ip: "45.87.23.156", country: "Nigeria", attempts: 1, timestamp: new Date(Date.now() - 7200000).toISOString(), severity: "medium" },
    { id: "sa_3", type: "API rate limit exceeded", user: "amir@pixelcraft.co", ip: "82.14.56.231", country: "Pakistan", attempts: 5, timestamp: new Date(Date.now() - 10800000).toISOString(), severity: "medium" },
    { id: "sa_4", type: "Brute force attempt", user: "admin@ufuqaudit.app", ip: "193.45.12.89", country: "Russia", attempts: 28, timestamp: new Date(Date.now() - 14400000).toISOString(), severity: "critical" },
    { id: "sa_5", type: "Password reset spam", user: "multiple", ip: "193.45.12.89", country: "Russia", attempts: 8, timestamp: new Date(Date.now() - 18000000).toISOString(), severity: "high" },
  ];

  // Active sessions
  const activeSessions = [
    { id: "sess_1", user: "admin@ufuqaudit.app", device: "Chrome on macOS", ip: "192.168.1.1", location: "Karachi, PK", startedAt: new Date(Date.now() - 3600000).toISOString(), lastActive: new Date(Date.now() - 300000).toISOString() },
    { id: "sess_2", user: "sarah@northwind.agency", device: "Safari on iPhone", ip: "73.22.45.12", location: "New York, US", startedAt: new Date(Date.now() - 7200000).toISOString(), lastActive: new Date(Date.now() - 600000).toISOString() },
    { id: "sess_3", user: "amir@pixelcraft.co", device: "Firefox on Linux", ip: "82.14.56.231", location: "Lahore, PK", startedAt: new Date(Date.now() - 14400000).toISOString(), lastActive: new Date(Date.now() - 900000).toISOString() },
    { id: "sess_4", user: "mike@brightlabs.io", device: "Edge on Windows", ip: "45.87.23.156", location: "London, UK", startedAt: new Date(Date.now() - 28800000).toISOString(), lastActive: new Date(Date.now() - 1800000).toISOString() },
  ];

  // Security settings
  const settings = {
    twoFactorRequired: false,
    adminTwoFactorRequired: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    apiRateLimit: 1000,
    ipWhitelist: [],
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecial: false,
  };

  // Admin audit log (recent)
  const adminAuditLog = [
    { id: "aal_1", admin: "admin@ufuqaudit.app", action: "Changed Pro plan price", module: "Plans", oldValue: "$39", newValue: "$49", ip: "192.168.1.1", timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: "aal_2", admin: "admin@ufuqaudit.app", action: "Suspended user john@acme.com", module: "Users", oldValue: "active", newValue: "suspended", ip: "192.168.1.1", timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: "aal_3", admin: "admin@ufuqaudit.app", action: "Updated scoring weights", module: "Scoring", oldValue: "tech:25 content:20 perf:15 aeo:15 geo:15 sec:10", newValue: "tech:30 content:20 perf:15 aeo:15 geo:10 sec:10", ip: "192.168.1.1", timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: "aal_4", admin: "admin@ufuqaudit.app", action: "Enabled AI Blog Generator (25% rollout)", module: "Feature Flags", oldValue: "disabled", newValue: "enabled 25%", ip: "192.168.1.1", timestamp: new Date(Date.now() - 172800000).toISOString() },
    { id: "aal_5", admin: "admin@ufuqaudit.app", action: "Revoked API key 'Development'", module: "API Keys", oldValue: "active", newValue: "revoked", ip: "192.168.1.1", timestamp: new Date(Date.now() - 259200000).toISOString() },
  ];

  return NextResponse.json({
    stats: {
      failedLoginsToday: failedLogins[failedLogins.length - 1].attempts,
      failedLogins30d: failedLogins.reduce((s, d) => s + d.attempts, 0),
      suspiciousEvents: suspiciousActivity.length,
      activeSessions: activeSessions.length,
      blockedIps: 12,
    },
    failedLogins,
    suspiciousActivity,
    activeSessions,
    settings,
    adminAuditLog,
  });
}
