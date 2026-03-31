import React from "react";

export default function Footer({ onNavigate }) {
  const currentYear = new Date().getFullYear();

  const handleNavigation = (route) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <footer className="w-full bg-black/30 backdrop-blur-sm border-t border-white/10 py-0.5 sm:py-3 mt-auto">
      <div className="max-w-6xl mx-auto px-3">
        {/* Main row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-0.5 sm:gap-3">
          {/* Left: Copyright + links */}
          <div className="w-full sm:w-auto flex flex-col items-center sm:items-start gap-0.5">
            <div className="text-gray-400 text-[9px] sm:text-xs text-center sm:text-left leading-none">
              © {currentYear} Magic Price Duel
            </div>

            {/* Mobile condensed links (keeps footer height low) */}
            <div className="sm:hidden flex items-center justify-center gap-2 text-[9px] text-gray-300 leading-none">
              <button
                onClick={() => handleNavigation("impressum")}
                className="hover:text-white transition whitespace-nowrap"
              >
                Legal
              </button>
              <span className="text-gray-600">·</span>
              <button
                onClick={() => handleNavigation("privacy")}
                className="hover:text-white transition whitespace-nowrap"
              >
                Privacy
              </button>
              <span className="text-gray-600">·</span>
              <button
                onClick={() => handleNavigation("terms")}
                className="hover:text-white transition whitespace-nowrap"
              >
                Terms
              </button>
            </div>

            {/* Desktop full links */}
            <div className="hidden sm:flex flex-wrap items-center gap-3 text-[11px] sm:text-sm">
              <button
                onClick={() => handleNavigation("impressum")}
                className="text-gray-300 hover:text-white transition"
              >
                Legal Notice
              </button>
              <button
                onClick={() => handleNavigation("privacy")}
                className="text-gray-300 hover:text-white transition"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => handleNavigation("terms")}
                className="text-gray-300 hover:text-white transition"
              >
                Terms of Service
              </button>
            </div>
          </div>

          {/* Right: Disclaimer */}
          <div className="text-gray-500 text-[9px] sm:text-xs text-center sm:text-right max-w-[210px] sm:max-w-xs leading-tight">
            Not officially affiliated with Wizards of the Coast
          </div>
        </div>

        {/* Attribution (secondary, slightly lower emphasis on mobile) */}
        <div className="text-center text-gray-500 text-[9px] sm:text-xs mt-1 sm:mt-2 leading-tight">
          Card data from{" "}
          <a
            href="https://scryfall.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            Scryfall
          </a>
        </div>
      </div>
    </footer>
  );
}
