import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { buildMetadata } from "@/lib/gtm/seo";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/gtm/seo";
import { JsonLd } from "@/lib/gtm/JsonLd";
import { Analytics } from "@/lib/gtm/analytics-loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// GTM-ready baseline metadata (title template, canonical, OG, Twitter,
// metadataBase). Pages override per-route via their own `metadata` export.
export const metadata: Metadata = buildMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {/* Site-level structured data: publisher + site identity. */}
        <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
        {children}
        {/* Analytics: no-op unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set. */}
        <Analytics />
      </body>
    </html>
  );
}
