import React, { useState } from 'react';
import { Download, Smartphone, X, Share, MoreVertical } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Suppress button when already installed or running inside Capacitor native shell
  if (isInstalled) {
    return null;
  }

  // Native browser install prompt available (Android Chrome / Desktop Chromium)
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-semibold shadow-sm transition-all cursor-pointer"
        title="Install MITALL as an app on your device"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari or Android mobile browser fallback instructions modal
  if (isIOS || isAndroid) {
    return (
      <>
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/35 text-xs font-semibold transition-all cursor-pointer"
          title="Install MITALL to Home Screen"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>Install</span>
        </button>

        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Install MITALL App</h3>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isIOS ? (
                <ol className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-400">1.</span>
                    <span>
                      Tap the <strong className="text-white inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 inline" /></strong> button in the Safari toolbar.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-400">2.</span>
                    <span>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-400">3.</span>
                    <span>Tap <strong className="text-white">Add</strong> in the top-right corner.</span>
                  </li>
                </ol>
              ) : (
                <ol className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-400">1.</span>
                    <span>
                      Make sure this page is open directly in <strong className="text-white">Google Chrome</strong> (not inside another app&apos;s built-in browser).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-400">2.</span>
                    <span>
                      Tap Chrome&apos;s menu <strong className="text-white inline-flex items-center"><MoreVertical className="w-3.5 h-3.5 inline" /></strong> in the top-right corner.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-400">3.</span>
                    <span>
                      Tap <strong className="text-white">Add to Home screen</strong> → <strong className="text-white">Install</strong>.
                    </span>
                  </li>
                </ol>
              )}

              <button
                onClick={() => setShowGuide(false)}
                className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
