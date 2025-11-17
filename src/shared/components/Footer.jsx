import React from "react";

export default function Footer({ onNavigate }) {
  const currentYear = new Date().getFullYear();

  const handleNavigation = (route) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <footer className="w-full bg-black/30 backdrop-blur-sm border-t border-white/10 py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-gray-400 text-sm">
            © {currentYear} Magic Preis-Duell. Alle Rechte vorbehalten.
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <button
              onClick={() => handleNavigation("impressum")}
              className="text-gray-300 hover:text-white transition"
            >
              Impressum
            </button>
            <button
              onClick={() => handleNavigation("privacy")}
              className="text-gray-300 hover:text-white transition"
            >
              Datenschutz
            </button>
            <button
              onClick={() => handleNavigation("terms")}
              className="text-gray-300 hover:text-white transition"
            >
              AGB
            </button>
          </div>

          {/* Disclaimer */}
          <div className="text-gray-500 text-xs text-center sm:text-right max-w-xs">
            Nicht offiziell mit Wizards of the Coast verbunden
          </div>
        </div>

        {/* Attribution */}
        <div className="text-center text-gray-500 text-xs mt-4">
          Kartendaten von{" "}
          <a
            href="https://scryfall.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Scryfall
          </a>
        </div>
      </div>
    </footer>
  );
}