import type { Metadata, Viewport } from "next";
import { Archivo_Black, Bebas_Neue, Lexend_Mega, Public_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { NotificationProvider } from "@/context/NotificationContext";
import BottomNav from "@/components/BottomNav";
import NotificationBanner from "@/components/NotificationBanner";
import GlobalNotifications from "@/components/GlobalNotifications";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const lexendMega = Lexend_Mega({
  variable: "--font-lexend-mega",
  subsets: ["latin"],
  display: "swap",
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Campus Marketplace | ABV-IIITM Gwalior",
  description:
    "Buy, sell & rent second-hand goods within ABV-IIITM Gwalior. A trusted campus marketplace built for students, by students.",
  keywords: ["campus marketplace", "IIITM", "second hand", "buy sell", "Gwalior", "students"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/app_logo.png", sizes: "1024x1024" },
    ],
    shortcut: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CampusMart",
  },
  applicationName: "CampusMart",
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F1FAEE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${lexendMega.variable} ${archivoBlack.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans relative isolate">
        <AuthProvider>
          <NotificationProvider>
            <SocketProvider>
              <GlobalNotifications />
              <NotificationBanner />
              {children}
              <BottomNav />
              <InstallPrompt />
              <Toaster richColors position="top-right" />
            </SocketProvider>
          </NotificationProvider>
        </AuthProvider>
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }
        `}</Script>
      </body>
    </html>
  );
}
