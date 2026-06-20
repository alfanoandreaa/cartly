import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Cartly — Save it. Track it. Buy it when it’s right.",
    template: "%s — Cartly"
  },
  description:
    "Your universal wishlist and price tracker. Save products from any store, organize your picks, and buy at the right moment.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Cartly — Your internet shopping shortlist",
    description: "Save it. Track it. Buy it when it’s right.",
    type: "website"
  },
  icons: { icon: "/icon.svg" }
};

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
