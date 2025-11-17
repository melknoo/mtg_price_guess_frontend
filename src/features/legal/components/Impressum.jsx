import React from "react";
import { motion } from "framer-motion";

export default function Impressum({ onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6"
    >
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
        <h1 className="text-4xl font-bold mb-6">Impressum</h1>
        
        <div className="space-y-6 text-gray-200">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">Angaben gemäß § 5 TMG</h2>
            <div className="bg-white/5 p-4 rounded-lg space-y-1">
              <p className="font-semibold">[DEIN NAME / FIRMENNAME]</p>
              <p>[STRASSE UND HAUSNUMMER]</p>
              <p>[PLZ UND ORT]</p>
              <p>[LAND]</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">Kontakt</h2>
            <div className="bg-white/5 p-4 rounded-lg space-y-1">
              <p>E-Mail: [DEINE EMAIL]</p>
              <p>Telefon: [OPTIONAL - DEINE TELEFONNUMMER]</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">Umsatzsteuer-ID</h2>
            <div className="bg-white/5 p-4 rounded-lg">
              <p>
                Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
              </p>
              <p className="mt-2">[DEINE UST-ID - Falls vorhanden, sonst entfernen]</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">Verantwortlich für den Inhalt</h2>
            <div className="bg-white/5 p-4 rounded-lg">
              <p>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</p>
              <p className="mt-2">[DEIN NAME]</p>
              <p>[DEINE ADRESSE]</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">Haftungsausschluss</h2>
            
            <h3 className="text-xl font-semibold mb-2 text-purple-200 mt-4">Haftung für Inhalte</h3>
            <p className="text-sm leading-relaxed">
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
              Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. 
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten 
              nach den allgemeinen Gesetzen verantwortlich.
            </p>

            <h3 className="text-xl font-semibold mb-2 text-purple-200 mt-4">Haftung für Links</h3>
            <p className="text-sm leading-relaxed">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen 
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber 
              der Seiten verantwortlich.
            </p>

            <h3 className="text-xl font-semibold mb-2 text-purple-200 mt-4">Urheberrecht</h3>
            <p className="text-sm leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
              dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art 
              der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen 
              Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">Verwendung von Magic: The Gathering Inhalten</h2>
            <div className="bg-white/5 p-4 rounded-lg space-y-2">
              <p className="text-sm leading-relaxed">
                Dieses Projekt nutzt Daten und Bilder von der Scryfall API. Magic: The Gathering und 
                alle zugehörigen Kartennamen, Illustrationen und Logos sind Eigentum von 
                Wizards of the Coast LLC.
              </p>
              <p className="text-sm leading-relaxed">
                Dieses Projekt ist nicht mit Wizards of the Coast verbunden, wird nicht von ihnen 
                gesponsert oder in anderer Weise unterstützt.
              </p>
              <p className="text-sm leading-relaxed">
                Kartendaten bereitgestellt von <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Scryfall</a>.
              </p>
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