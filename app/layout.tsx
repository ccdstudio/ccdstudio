import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

// DESIGN.md: Halyard Display (proprietária) → substituta Inter
const inter = Inter({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-inter" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "CCD Studio",
  description: "CCD Studio — AM Educação",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={cn("dark h-full antialiased", inter.variable, geistMono.variable)}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
