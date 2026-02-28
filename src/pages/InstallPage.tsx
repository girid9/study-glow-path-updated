import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary">
          {installed ? (
            <Check className="h-10 w-10 text-primary-foreground" />
          ) : (
            <Smartphone className="h-10 w-10 text-primary-foreground" />
          )}
        </div>

        <h1 className="font-display text-3xl font-bold">
          {installed ? "Installed!" : "Install App"}
        </h1>

        <p className="text-sm text-muted-foreground">
          {installed
            ? "ICTSM Quiz is now on your home screen. Open it anytime!"
            : "Install ICTSM Quiz on your device for quick access, offline support, and a native app experience."}
        </p>

        {!installed && (
          <div className="glass rounded-2xl p-5 space-y-4">
            {deferredPrompt ? (
              <Button onClick={handleInstall} className="w-full h-12 rounded-xl font-bold gap-2">
                <Download className="h-5 w-5" /> Install Now
              </Button>
            ) : (
              <div className="space-y-3 text-left">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">How to install:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 glass rounded-xl p-3">
                    <span className="font-bold text-primary">1</span>
                    <span className="text-sm">Tap the <strong>⋮ menu</strong> (Chrome) or <strong>Share</strong> button (Safari)</span>
                  </div>
                  <div className="flex items-start gap-3 glass rounded-xl p-3">
                    <span className="font-bold text-primary">2</span>
                    <span className="text-sm">Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong></span>
                  </div>
                  <div className="flex items-start gap-3 glass rounded-xl p-3">
                    <span className="font-bold text-primary">3</span>
                    <span className="text-sm">Tap <strong>Add</strong> to confirm</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="rounded-xl"
        >
          Back to Home
        </Button>
      </motion.div>
    </div>
  );
};

export default InstallPage;
