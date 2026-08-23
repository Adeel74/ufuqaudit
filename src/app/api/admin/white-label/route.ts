// GET /api/admin/white-label — white-label/branding management
import { NextResponse } from "next/server";

interface WhiteLabelConfig {
  id: string;
  orgName: string;
  domain: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  customCss: string;
  customDomain: string;
  emailFromName: string;
  emailFromAddress: string;
  reportFooter: string;
  portalEnabled: boolean;
  status: "active" | "pending" | "disabled";
  createdAt: string;
}

const CONFIGS: WhiteLabelConfig[] = [
  { id: "wl_1", orgName: "Northwind Digital", domain: "northwind.agency", brandName: "Northwind SEO", primaryColor: "#10b981", secondaryColor: "#14b8a6", logoUrl: "/logos/northwind.svg", customCss: "", customDomain: "audit.northwind.agency", emailFromName: "Northwind SEO", emailFromAddress: "reports@northwind.agency", reportFooter: "© Northwind Digital — All rights reserved", portalEnabled: true, status: "active", createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: "wl_2", orgName: "PixelCraft Co", domain: "pixelcraft.co", brandName: "PixelCraft Audit", primaryColor: "#8b5cf6", secondaryColor: "#ec4899", logoUrl: "/logos/pixelcraft.svg", customCss: "/* custom styles */", customDomain: "audit.pixelcraft.co", emailFromName: "PixelCraft", emailFromAddress: "no-reply@pixelcraft.co", reportFooter: "© PixelCraft Co", portalEnabled: true, status: "active", createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "wl_3", orgName: "Bright Labs", domain: "brightlabs.io", brandName: "BrightAudit", primaryColor: "#0ea5e9", secondaryColor: "#6366f1", logoUrl: "", customCss: "", customDomain: "", emailFromName: "Bright Labs", emailFromAddress: "reports@brightlabs.io", reportFooter: "© Bright Labs", portalEnabled: false, status: "pending", createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
];

export async function GET() {
  return NextResponse.json({
    configs: CONFIGS,
    stats: {
      total: CONFIGS.length,
      active: CONFIGS.filter((c) => c.status === "active").length,
      pending: CONFIGS.filter((c) => c.status === "pending").length,
      disabled: CONFIGS.filter((c) => c.status === "disabled").length,
      customDomains: CONFIGS.filter((c) => c.customDomain).length,
    },
  });
}
