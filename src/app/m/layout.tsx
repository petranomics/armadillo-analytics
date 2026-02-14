import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Armadillo Analytics",
  description: "Social media analytics for creators. Texas-built.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-armadillo-bg relative">
      {children}
    </div>
  );
}
