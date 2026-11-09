import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Sometype_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

// DESIGN.md: Inter (texto), Plus Jakarta Sans (títulos), Sometype Mono (rótulos técnicos).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const sometype = Sometype_Mono({ subsets: ["latin"], variable: "--font-sometype" });

export const metadata: Metadata = {
  title: "CCD Studio",
  description: "CCD Studio — AM Educação",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={cn("h-full antialiased", inter.variable, jakarta.variable, sometype.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
