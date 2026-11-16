"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // التحقق مما إذا كان التطبيق مثبتاً ويعمل بالفعل كـ PWA
    const isApp = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone;
    setIsStandalone(Boolean(isApp));

    // تسجيل الـ Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[Hafiz PWA] Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[Hafiz PWA] Service Worker registration failed:", err);
        });
    }

    // الاستماع لحدث قبل التثبيت
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // التحقق مما إذا كان المستخدم قد أغلق البانر سابقاً
      const dismissed = localStorage.getItem("hafiz-pwa-dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    window.addEventListener("appinstalled", () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem("hafiz-pwa-dismissed", "true");
    } catch {}
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-gold/40 bg-card/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">تثبيت تطبيق حافظ</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              ثبّت التطبيق على جهازك للوصول الفوري وتتبع الحفظ حتى دون إنترنت.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-xs text-muted-foreground"
        >
          لاحقاً
        </Button>
        <Button
          size="sm"
          onClick={handleInstallClick}
          className="bg-gold text-background hover:bg-gold/90 font-semibold text-xs gap-1.5 shadow-md"
        >
          <Download className="h-3.5 w-3.5" />
          تثبيت الآن
        </Button>
      </div>
    </div>
  );
}
