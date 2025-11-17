import React from "react";
import { motion } from "framer-motion";

export default function Terms({ onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6"
    >
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
        <h1 className="text-4xl font-bold mb-6">Allgemeine Geschäftsbedingungen (AGB)</h1>
        
        <div className="space-y-6 text-gray-200">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung des Online-Spiels 
              "Magic Preis-Duell". Mit der Registrierung und Nutzung des Spiels erklärst du dich 
              mit diesen Bedingungen einverstanden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">2. Leistungsbeschreibung</h2>
            <p className="mb-3">
              "Magic Preis-Duell" ist ein kostenloses Browser-Spiel, bei dem Nutzer ihr Wissen über 
              Magic: The Gathering Kartenpreise testen können.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Registrierung und Nutzung sind kostenlos</li>
              <li>Es werden keine In-App-Käufe oder kostenpflichtige Features angeboten</li>
              <li>Das Spiel dient ausschließlich Unterhaltungszwecken</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">3. Registrierung und Nutzerkonto</h2>
            <p className="mb-3">Für die Nutzung bestimmter Funktionen ist eine Registrierung erforderlich:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Bei der Registrierung sind wahrheitsgemäße Angaben zu machen</li>
              <li>Der Benutzername darf nicht gegen geltendes Recht verstoßen oder andere verletzen</li>
              <li>Du bist für die Geheimhaltung deines Passworts selbst verantwortlich</li>
              <li>Ein Account ist nicht übertragbar</li>
              <li>Du kannst deinen Account jederzeit löschen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">4. Nutzungsregeln</h2>
            <p className="mb-3">Bei der Nutzung des Spiels ist untersagt:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Verwendung von Bots, Cheats oder anderen Manipulationsprogrammen</li>
              <li>Missbrauch von Bugs oder Exploits</li>
              <li>Belästigung oder Beleidigung anderer Nutzer</li>
              <li>Verwendung mehrerer Accounts zur Manipulation der Rangliste</li>
              <li>Automatisierte Zugriffe auf die API</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">5. Highscores und Ranglisten</h2>
            <p className="mb-3">
              Highscores werden automatisch gespeichert und in der öffentlichen Rangliste angezeigt:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Benutzernamen und Highscores sind für alle Nutzer sichtbar</li>
              <li>Wir behalten uns vor, manipulierte Scores zu löschen</li>
              <li>Bei Regelverstoß können Accounts gesperrt werden</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">6. Verfügbarkeit</h2>
            <p>
              Wir bemühen uns um eine hohe Verfügbarkeit des Spiels, können aber keine 100%ige 
              Erreichbarkeit garantieren. Es besteht kein Anspruch auf ständige Verfügbarkeit. 
              Wartungsarbeiten können zu temporären Ausfällen führen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">7. Haftung</h2>
            <p className="mb-3">Unsere Haftung ist wie folgt beschränkt:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Bei Vorsatz und grober Fahrlässigkeit haften wir unbeschränkt</li>
              <li>Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten</li>
              <li>Die Haftung für Datenverlust ist begrenzt auf den typischen Wiederherstellungsaufwand</li>
              <li>Eine Haftung für die Richtigkeit der Kartenpreise wird ausgeschlossen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">8. Geistiges Eigentum</h2>
            <div className="space-y-3">
              <p>
                Magic: The Gathering, alle Kartennamen, Bilder und das MTG-Logo sind Eigentum von 
                Wizards of the Coast LLC. Dieses Projekt nutzt Daten von Scryfall und ist nicht 
                offiziell mit Wizards of the Coast verbunden.
              </p>
              <p>
                Der Quellcode und die Gestaltung des Spiels unterliegen dem Urheberrecht des Betreibers, 
                sofern nicht anders angegeben.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">9. Änderungen der AGB</h2>
            <p>
              Wir behalten uns vor, diese AGB jederzeit zu ändern. Änderungen werden auf dieser Seite 
              veröffentlicht. Die weitere Nutzung nach Änderung gilt als Zustimmung zu den neuen 
              Bedingungen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">10. Account-Löschung</h2>
            <p className="mb-3">
              Du kannst deinen Account jederzeit löschen:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Kontaktiere uns per E-Mail mit deiner Löschanfrage</li>
              <li>Alle personenbezogenen Daten werden innerhalb von 30 Tagen gelöscht</li>
              <li>Highscores können anonymisiert in der Rangliste verbleiben</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">11. Schlussbestimmungen</h2>
            <p className="mb-3">
              Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne Bestimmungen dieser 
              AGB unwirksam sein, berührt dies die Wirksamkeit der übrigen Bestimmungen nicht.
            </p>
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