"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running as installed PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Check if user dismissed recently (24h cooldown)
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) return;

    // Detect iOS (Safari doesn't fire beforeinstallprompt)
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    if (ios) {
      // Show iOS-specific instructions after 3s delay
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop Chrome — capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-[90] animate-in slide-in-from-bottom-4">
      <div className="bg-[#1D3557] text-[#F1FAEE] border-2 border-[#F9C74F] rounded-lg p-4 shadow-[4px_4px_0px_0px_#F9C74F]">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-[#F1FAEE]/60 hover:text-[#F1FAEE]"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-[#F9C74F] bg-white">
            <img src="/app_logo.png" alt="CampusMart" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm">Install CampusMart</h3>
            <p className="text-xs text-[#F1FAEE]/80 mt-0.5">
              {isIOS
                ? "Tap the share button, then \"Add to Home Screen\" for the full app experience!"
                : "Get the full app experience — faster loading, works offline, home screen icon!"
              }
            </p>

            {isIOS ? (
              <div className="mt-2 flex items-center gap-2 text-xs font-bold text-[#F9C74F]">
                <Smartphone className="w-4 h-4" />
                <span>Share &rarr; Add to Home Screen</span>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-[#F9C74F] text-[#1D3557] text-xs font-black rounded-md border-2 border-[#1D3557] shadow-[2px_2px_0px_0px_#F1FAEE] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
