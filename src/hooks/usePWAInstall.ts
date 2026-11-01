import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global reference so multiple components share the deferred prompt
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Generates an iOS apple-touch-startup-image splash screen dynamically on iOS devices
 * so launching from the Home Screen shows a native dark studio launch screen.
 */
function injectIOSSplashScreen() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (document.querySelector('link[rel="apple-touch-startup-image"]')) return;

  try {
    const dpr = window.devicePixelRatio || 2;
    const width = Math.round(window.screen.width * dpr);
    const height = Math.round(window.screen.height * dpr);
    if (!width || !height) return;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark studio background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0b0e17');
    bgGrad.addColorStop(0.5, '#080a0f');
    bgGrad.addColorStop(1, '#111526');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle radial glow in center
    const cx = width / 2;
    const cy = height / 2 - 40 * dpr;
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160 * dpr);
    glow.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    glow.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Draw central studio icon box
    const boxSize = 96 * dpr;
    const bx = cx - boxSize / 2;
    const by = cy - boxSize / 2;
    const r = 22 * dpr;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bx, by, boxSize, boxSize, r);
    ctx.fillStyle = '#0f1322';
    ctx.fill();
    ctx.lineWidth = 2 * dpr;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
    ctx.stroke();
    ctx.restore();

    // Draw "HL" monogram in center
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${34 * dpr}px -apple-system, BlinkMacSystemFont, "Syne", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HL', cx, cy + 2 * dpr);

    // Studio title below icon
    ctx.fillStyle = '#f8fafc';
    ctx.font = `700 ${20 * dpr}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText('Horvát László Studio', cx, cy + 84 * dpr);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 ${13 * dpr}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText('Web & Project Studio', cx, cy + 110 * dpr);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('link');
    link.rel = 'apple-touch-startup-image';
    link.href = dataUrl;
    document.head.appendChild(link);
  } catch {
    // Ignore canvas errors on restricted browsers
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    globalDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    const isSafariBrowser =
      /safari/.test(userAgent) && !/chrome|crios|fxios|edgios|opr/.test(userAgent);
    setIsSafari(isSafariBrowser);

    if (isIOSDevice) {
      injectIOSSplashScreen();
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, []);

  const install = useCallback(async () => {
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    if (!promptToUse) return false;
    await promptToUse.prompt();
    const { outcome } = await promptToUse.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const openIOSGuide = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open_ios_pwa_guide'));
  }, []);

  return {
    isInstallable: !!(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    isSafari,
    install,
    openIOSGuide,
  };
}
