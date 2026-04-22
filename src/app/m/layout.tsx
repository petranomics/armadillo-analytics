import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistrar } from "@/components/mobile/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "Armadillo Analytics",
  description: "Social media analytics for creators. Texas-built.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Armadillo",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F1117",
  viewportFit: "cover",
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-armadillo-bg relative">
      <ServiceWorkerRegistrar />
      {children}
    </div>
  );
}
