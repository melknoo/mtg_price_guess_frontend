import React, { useState, useEffect } from "react";

export default function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("install_banner_dismissed");
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isStandalone && !dismissed && isMobile) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-purple-900 border-t border-purple-600 px-4 py-3 flex items-center justify-between gap-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
    >
      <div className="flex items-center gap-2 text-sm text-white">
        <span className="text-xl">📲</span>
        <span>
          {isIOS
            ? 'Add to Home Screen: Share → "Add to Home Screen"'
            : "Install the app for a better experience"}
        </span>
      </div>
      <button
        onClick={() => { sessionStorage.setItem("install_banner_dismissed", "1"); setShow(false); }}
        className="text-purple-300 hover:text-white text-xl leading-none shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
