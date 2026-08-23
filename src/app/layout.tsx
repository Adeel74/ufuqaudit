import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UfuqAudit — AI-Powered Website Audit for SEO, AEO & GEO",
  description:
    "Find what's wrong, understand why, get the fix. UfuqAudit analyzes your website across Technical SEO, Content, AEO, GEO/AI Visibility, Performance and Security — with AI-generated recommendations.",
  keywords: ["SEO audit", "AEO", "GEO", "AI visibility", "website audit", "Core Web Vitals", "schema"],
  authors: [{ name: "UfuqTechs" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "UfuqAudit — AI-Powered Website Audit",
    description: "SEO + AEO + GEO + Performance + Security audit with AI-generated fixes.",
    url: "https://ufuqaudit.app",
    siteName: "UfuqAudit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UfuqAudit",
    description: "AI-Powered Website Audit for SEO, AEO & GEO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
          <SonnerToaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
