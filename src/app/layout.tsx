import type { Metadata } from "next";
import { Bodoni_Moda, Lexend } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/layout/LayoutShell";

const bodoniModa = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const lexend = Lexend({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Armadillo Analytics",
  description: "Social media analytics for creators. Texas-built.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${bodoniModa.variable} ${lexend.variable} antialiased`}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
