import React, { useState } from "react";
import { motion } from "framer-motion";

export default function ChangePassword({ onBack, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validierung
    if (newPassword.length < 6) {
      setError("⚠️ The new password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("⚠️ The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("⚠️ The new password must be different from the old one.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error while changing password.");
      }

      setSuccess("✅ Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      console.error("Change password error:", err);
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
      <h2 className="text-2xl font-bold mb-6">Change Password</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Current Password
          </label>
          <input
            type="password"
            placeholder="Current Password"
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-purple-500 focus:outline-none"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            New Password
          </label>
          <input
            type="password"
            placeholder="New Password (at least 6 characters)"
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-purple-500 focus:outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Neues Passwort bestätigen
          </label>
          <input
            type="password"
            placeholder="Neues Passwort wiederholen"
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-purple-500 focus:outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3 text-sm">
          <p className="text-blue-200">
            💡 <strong>Tipp:</strong> Tip: Use a strong password with at least 8 characters, upper and lowercase letters, and numbers.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition font-medium ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}