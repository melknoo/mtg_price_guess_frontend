import React from "react";
import { motion } from "framer-motion";

export default function PrivacyPolicy({ onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6"
    >
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
        <h1 className="text-4xl font-bold mb-6">Datenschutzerklärung</h1>
        
        <div className="space-y-6 text-gray-200">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">1. Verantwortlicher</h2>
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:
            </p>
            <div className="bg-white/5 p-4 rounded-lg mt-2">
              <p>[DEIN NAME]</p>
              <p>[DEINE ADRESSE]</p>
              <p>E-Mail: [DEINE EMAIL]</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">2. Erhebung und Speicherung personenbezogener Daten</h2>
            <p className="mb-3">Bei der Nutzung unseres Spiels erheben wir folgende Daten:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>E-Mail-Adresse:</strong> Zur Erstellung und Verwaltung deines Accounts</li>
              <li><strong>Benutzername:</strong> Zur Identifikation in Ranglisten</li>
              <li><strong>Highscore:</strong> Zur Speicherung deiner Spielergebnisse</li>
              <li><strong>Passwort:</strong> Gespeichert als Hash (nicht im Klartext)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">3. Rechtsgrundlage</h2>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Erfüllung 
              des Nutzungsvertrags (Bereitstellung des Spiels und der Account-Funktionen).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">4. Speicherdauer</h2>
            <p>
              Deine Daten werden gespeichert, solange dein Account aktiv ist. Bei Löschung deines 
              Accounts werden alle personenbezogenen Daten gelöscht.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">5. Weitergabe an Dritte</h2>
            <p className="mb-3">Wir nutzen folgende externe Dienste:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Fly.io:</strong> Hosting des Backends (Server in [REGION])</li>
              <li><strong>Scryfall API:</strong> Bereitstellung der Magic: The Gathering Kartendaten (keine personenbezogenen Daten werden übermittelt)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">6. Cookies und Local Storage</h2>
            <p className="mb-3">Wir verwenden folgende Technologien:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Local Storage:</strong> Speicherung des Authentifizierungs-Tokens (technisch notwendig)</li>
              <li>Diese Daten bleiben lokal in deinem Browser und werden nicht an Dritte übermittelt</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">7. Deine Rechte</h2>
            <p className="mb-3">Du hast folgende Rechte:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Auskunft:</strong> Recht auf Auskunft über deine gespeicherten Daten</li>
              <li><strong>Berichtigung:</strong> Recht auf Korrektur falscher Daten</li>
              <li><strong>Löschung:</strong> Recht auf Löschung deiner Daten ("Recht auf Vergessenwerden")</li>
              <li><strong>Datenportabilität:</strong> Recht auf Erhalt deiner Daten in strukturiertem Format</li>
              <li><strong>Widerspruch:</strong> Recht auf Widerspruch gegen die Datenverarbeitung</li>
              <li><strong>Beschwerde:</strong> Recht auf Beschwerde bei einer Aufsichtsbehörde</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">8. Datensicherheit</h2>
            <p>
              Wir verwenden HTTPS-Verschlüsselung für die Datenübertragung und speichern Passwörter 
              nur als Hash. Dennoch können wir keine absolute Sicherheit garantieren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">9. Kontakt für Datenschutzanfragen</h2>
            <p>
              Bei Fragen zum Datenschutz oder zur Ausübung deiner Rechte kontaktiere uns unter:
            </p>
            <div className="bg-white/5 p-4 rounded-lg mt-2">
              <p>E-Mail: [DEINE EMAIL]</p>
            </div>
          </section>

          <section className="pt-4 border-t border-white/20">
            <p className="text-sm text-gray-400">
              Stand: {new Date().toLocaleDateString('de-DE')}
            </p>
          </section>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="mt-8 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
          >
            ← Zurück
          </button>
        )}
      </div>
    </motion.div>
  );
}