import type { Metadata } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "SmartMenu - AI-Powered Digital Menus for Restaurants",
  description: "Transform any restaurant menu with AI translation (50+ languages), photo enhancement, and instant QR codes. Perfect for all cuisines in New Zealand.",
  keywords: "digital menu, restaurant menu, QR code menu, AI translation, menu translation, food photo enhancement, restaurant technology, New Zealand restaurants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">
        <TabBar />
        <div>
          {children}
        </div>
      </body>
    </html>
  );
}

