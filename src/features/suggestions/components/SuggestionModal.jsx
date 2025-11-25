import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SuggestionModal({ isOpen, onClose, onSubmit }) {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (suggestion.trim().length < 10) {
      setError("⚠️ Please enter at least 10 characters.");
      return;
    }

    setLoading(true);

    try {
      await onSubmit(suggestion.trim());
      setSuccess(true);
      setSuggestion("");
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Suggestion error:", err);
      setError(`❌ ${err.message || "Error submitting suggestion."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSuggestion("");
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl max-w-md w-full border-2 border-purple-500"
            >
              <h2 className="text-2xl font-bold mb-4 text-white">
                💡 Your Suggestion
              </h2>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/20 border-2 border-green-500 rounded-lg p-6 text-center"
                >
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-green-300 font-semibold text-lg">
                    Thank you for your suggestion!
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-200">
                      What would you like to suggest?
                    </label>
                    <textarea
                      placeholder="Share your ideas, feature requests, or improvements..."
                      className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-purple-500 focus:outline-none resize-none"
                      rows={6}
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      maxLength={500}
                      required
                    />
                    <div className="text-right text-xs text-gray-400 mt-1">
                      {suggestion.length}/500 characters
                    </div>
                  </div>

                  <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3 text-sm">
                    <p className="text-blue-200">
                      💭 <strong>Tip:</strong> Be as specific as possible. This helps us understand and implement your idea better!
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg transition font-medium text-white disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || suggestion.trim().length < 10}
                      className={`flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition font-medium text-white ${
                        (loading || suggestion.trim().length < 10) ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⏳</span>
                          Submitting...
                        </span>
                      ) : (
                        "Submit"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}