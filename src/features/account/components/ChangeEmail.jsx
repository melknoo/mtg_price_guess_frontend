import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/context/AuthContext";

export default function ChangeEmail({ onBack, onSuccess }) {
  const { user, refreshUser } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validierung
    if (!validateEmail(newEmail)) {
      setError("⚠️ Please enter a valid email address.");
      return;
    }

    if (newEmail === user.email) {
      setError("⚠️ The new email address must be different from the old one.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/user/change-email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          newEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error while changing email.");
      }

      setSuccess("✅ Email changed successfully!");
      setNewEmail("");
      setPassword("");

      // Aktualisiere User-Daten
      await refreshUser();

      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      console.error("Change email error:", err);
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl"
    >
      <h2 className="text-2xl font-bold mb-6">Change Email Address</h2>

      {error && (
        <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 text-green-300 p-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <div className="bg-white/5 p-3 rounded-lg mb-4 text-sm">
        <p className="text-gray-300">
          Current Email: <span className="font-medium text-white">{user.email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            New E-Mail-Address
          </label>
          <input
            type="email"
            placeholder="new@email.com"
            className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/40 focus:border-amber-400/60 focus:outline-none"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Password for Confirmation
          </label>
          <input
            type="password"
            placeholder="Your current password"
            className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/40 focus:border-amber-400/60 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 text-sm">
          <p className="text-yellow-200">
            ⚠️ <strong>Note:</strong>After the change, you may need to log in with the new email address.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary flex-1 text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary flex-1 text-base ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Changing..." : "Change Email"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}