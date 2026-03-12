import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/context/AuthContext";
import DeleteAccount from "./DeleteAccount";
import ChangePassword from "./ChangePassword";
import ChangeEmail from "./ChangeEmail";

export default function AccountSettings({ onBack }) {
  const { user } = useAuth();
  const [view, setView] = useState("main"); // main, delete, password, email

  if (view === "delete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6 flex items-center justify-center">
        <DeleteAccount
          onBack={() => setView("main")}
          onDeleteSuccess={() => {
            // Lösche Token und leite zum Login weiter
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
        />
      </div>
    );
  }

  if (view === "password") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6 flex items-center justify-center">
        <ChangePassword
          onBack={() => setView("main")}
          onSuccess={() => setView("main")}
        />
      </div>
    );
  }

  if (view === "email") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6 flex items-center justify-center">
        <ChangeEmail
          onBack={() => setView("main")}
          onSuccess={() => setView("main")}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl"
    >
      <h2 className="text-3xl font-bold mb-6">Account Settings</h2>

      <div className="space-y-6 text-gray-200">
        {/* Account Info */}
        <section className="bg-white/5 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-3 text-purple-300">Your Data</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Username:</span>
              <span className="font-medium">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">E-Mail:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Highscore:</span>
              <span className="font-medium text-green-400">{user.highscore || 0}</span>
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section className="bg-white/5 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-3 text-purple-300">Account-Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setView("password")}
              className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition font-medium text-left flex items-center justify-between"
            >
              <span>🔒 Change Password</span>
              <span className="text-sm text-purple-200">→</span>
            </button>
            
            <button
              onClick={() => setView("email")}
              className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition font-medium text-left flex items-center justify-between"
            >
              <span>📧 Change E-Mail</span>
              <span className="text-sm text-blue-200">→</span>
            </button>
          </div>
        </section>

        {/* Datenschutz */}
        <section className="bg-white/5 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-3 text-purple-300">Privacy & Rights</h3>
          <p className="text-sm text-gray-300 mb-4">
            According to GDPR, you have the following rights regarding your data:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Right to information about your stored data"</li>
            <li>Right to correct incorrect data</li>
            <li>Right to delete your data</li>
            <li>Right to data portability</li>
          </ul>
          <p className="text-sm text-gray-400 mt-4">
            For questions about your data, contact us at::{" "}
            <a href="mailto:datenschutz@magic-preis-duell.de" className="text-blue-400 hover:underline">
              melleee17+magic-price-guess@gmail.com
            </a>
          </p>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/10 border-2 border-red-500 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-3 text-red-400">Danger Zone</h3>
          <p className="text-sm text-gray-300 mb-4">
            Deleting your account is irreversible. All your data will be permanently removed.
          </p>
          <button
            onClick={() => setView("delete")}
            className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition font-medium"
          >
            Delete Account
          </button>
        </section>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition font-medium text-white"
        >
          Back to Menu
        </button>
      </div>
    </motion.div>
  );
}