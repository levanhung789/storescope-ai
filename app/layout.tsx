import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ArcProvider from "./_components/ArcProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StoreScope AI — Retail Intelligence Platform",
  description:
    "Transform shelf images into structured business intelligence. AI-powered product detection, SKU classification, and retail analytics for FMCG teams.",
  keywords: ["retail AI", "shelf analytics", "FMCG", "product detection", "SKU classification"],
  openGraph: {
    title: "StoreScope AI",
    description: "Turn shelf photos into retail intelligence.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ArcProvider>
          {children}
        </ArcProvider>
      </body>
    </html>
  );
}
