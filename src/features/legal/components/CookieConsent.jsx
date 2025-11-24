import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setShowBanner(false);
    // Optional: Logout if user declines, as auth token is technically necessary
    // logout();
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-purple-500/50 p-4 sm:p-6 shadow-2xl z-50"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-2">
                  🍪 Note on Cookies and Local Storage
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  We use Local Storage to save your login status (technically necessary). 
                  Without this functionality, you cannot use the game. 
                  More information can be found in our{" "}
                  <a 
                    href="#/privacy" 
                    className="text-purple-400 hover:text-purple-300 underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.hash = "/privacy";
                    }}
                  >
                    Privacy Policy
                  </a>.
                </p>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDecline}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}