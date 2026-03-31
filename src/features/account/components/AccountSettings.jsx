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
      <div className="min-h-[100dvh] text-white p-6 flex items-center justify-center">
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
      <div className="min-h-[100dvh] text-white p-6 flex items-center justify-center">
        <ChangePassword
          onBack={() => setView("main")}
          onSuccess={() => setView("main")}
        />
      </div>
    );
  }

  if (view === "email") {
    return (
      <div className="min-h-[100dvh] text-white p-6 flex items-center justify-center">
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
      className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-6 sm:p-8 shadow-2xl"
    >
      <h2 className="text-3xl font-bold mb-6">Account Settings</h2>

      <div className="space-y-6 text-gray-200">
        {/* Account Info */}
        <section className="panel p-4">
          <h3 className="text-xl font-semibold mb-3 text-amber-300">Your Data</h3>
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
        <section className="panel p-4">
          <h3 className="text-xl font-semibold mb-3 text-amber-300">Account-Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setView("password")}
              className="btn-secondary btn-full text-base text-left flex items-center justify-between"
            >
              <span>🔒 Change Password</span>
              <span className="text-sm text-white/60">→</span>
            </button>

            <button
              onClick={() => setView("email")}
              className="btn-secondary btn-full text-base text-left flex items-center justify-between"
            >
              <span>📧 Change E-Mail</span>
              <span className="text-sm text-white/60">→</span>
            </button>
          </div>
        </section>

        {/* Privacy & Legal Overview */}
        <section className="panel p-4">
          <h3 className="text-xl font-semibold mb-3 text-amber-300">Privacy & Rights</h3>
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
            For questions about your data, contact{" "}
            <a href="mailto:melle17@gmx.de" className="text-amber-400 hover:underline">
              Melvin Lorenze-Knop (melle17@gmx.de)
            </a>
          </p>
        </section>

        {/* Legal Texts (previously separate pages) */}
        <section className="panel p-4 space-y-4">
          <h3 className="text-xl font-semibold mb-3 text-amber-300">Legal Information</h3>

          <div className="space-y-2 text-sm text-gray-200">
            <h4 className="font-semibold text-amber-200">Impressum / Legal Notice</h4>
            <p>
              Responsible for this game (according to § 5 TMG / EU law) is{" "}
              <span className="font-semibold">Melvin Lorenze-Knop</span>.  
              Contact via e-mail:{" "}
              <a href="mailto:melle17@gmx.de" className="text-amber-400 hover:underline">
                melle17@gmx.de
              </a>.
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-200">
            <h4 className="font-semibold text-amber-200">Privacy Policy (Kurzfassung)</h4>
            <p>
              Für die Nutzung von Magic Price Duel werden ausschließlich die Daten verarbeitet,
              die für den Betrieb des Spiels notwendig sind: Benutzerkonto (E-Mail, Username, Passwort-Hash),
              Highscores und Spielstatistiken. Die Daten werden nur für dieses Spiel verwendet und nicht an
              Dritte verkauft.
            </p>
            <p>
              Du kannst jederzeit die Löschung deines Accounts und deiner Daten anfordern, indem du die
              Account-Löschfunktion unten nutzt oder eine E-Mail an{" "}
              <a href="mailto:melle17@gmx.de" className="text-amber-400 hover:underline">
                melle17@gmx.de
              </a>{" "}
              sendest.
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-200">
            <h4 className="font-semibold text-amber-200">Terms of Service (Kurzfassung)</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Das Spiel ist kostenlos und dient nur zur Unterhaltung.</li>
              <li>Cheats, Bots oder bewusste Manipulation der Leaderboards sind nicht erlaubt.</li>
              <li>Wir übernehmen keine Haftung für die Richtigkeit der Kartenpreise.</li>
              <li>Magic: The Gathering und alle zugehörigen Marken gehören Wizards of the Coast LLC.</li>
              <li>
                Magic Price Duel nutzt Kartendaten von{" "}
                <span className="font-semibold">Scryfall</span> und ist nicht offiziell mit
                Wizards of the Coast verbunden.
              </li>
            </ul>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="panel-danger p-4">
          <h3 className="text-xl font-semibold mb-3 text-red-400">Danger Zone</h3>
          <p className="text-sm text-gray-300 mb-4">
            Deleting your account is irreversible. All your data will be permanently removed.
          </p>
          <button
            onClick={() => setView("delete")}
            className="btn-danger btn-full"
          >
            Delete Account
          </button>
        </section>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="btn-secondary btn-full"
        >
          Back to Menu
        </button>
      </div>
    </motion.div>
  );
}