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
        <h1 className="text-4xl font-bold mb-6">Terms and Conditions</h1>
        
        <div className="space-y-6 text-gray-200">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">1. Scope</h2>
            <p>
              These Terms and Conditions apply to the use of the online game 
              "Magic Price Duel". By registering and using the game, you agree 
              to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">2. Service Description</h2>
            <p className="mb-3">
              "Magic Price Duel" is a free browser game where users can test their knowledge of 
              Magic: The Gathering card prices.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Registration and use are free</li>
              <li>No in-app purchases or paid features are offered</li>
              <li>The game is for entertainment purposes only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">3. Registration and User Account</h2>
            <p className="mb-3">Registration is required to use certain features:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Truthful information must be provided during registration</li>
              <li>Username must not violate applicable law or harm others</li>
              <li>You are responsible for keeping your password confidential</li>
              <li>An account is not transferable</li>
              <li>You can delete your account at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">4. Usage Rules</h2>
            <p className="mb-3">The following is prohibited when using the game:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use of bots, cheats, or other manipulation programs</li>
              <li>Abuse of bugs or exploits</li>
              <li>Harassment or insults of other users</li>
              <li>Use of multiple accounts to manipulate the leaderboard</li>
              <li>Automated access to the API</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">5. Highscores and Leaderboards</h2>
            <p className="mb-3">
              Highscores are automatically saved and displayed on the public leaderboard:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Usernames and highscores are visible to all users</li>
              <li>We reserve the right to delete manipulated scores</li>
              <li>Accounts may be banned for rule violations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">6. Availability</h2>
            <p>
              We strive for high availability of the game, but cannot guarantee 100% 
              accessibility. There is no claim to constant availability. 
              Maintenance work may lead to temporary outages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">7. Liability</h2>
            <p className="mb-3">Our liability is limited as follows:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We are liable without limitation for intent and gross negligence</li>
              <li>For slight negligence, we are only liable for breach of essential contractual obligations</li>
              <li>Liability for data loss is limited to typical recovery costs</li>
              <li>Liability for the accuracy of card prices is excluded</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">8. Intellectual Property</h2>
            <div className="space-y-3">
              <p>
                Magic: The Gathering, all card names, images, and the MTG logo are property of 
                Wizards of the Coast LLC. This project uses data from Scryfall and is not 
                officially affiliated with Wizards of the Coast.
              </p>
              <p>
                The source code and design of the game are subject to the copyright of the operator, 
                unless otherwise stated.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">9. Changes to Terms</h2>
            <p>
              We reserve the right to change these terms at any time. Changes will be 
              published on this page. Continued use after changes constitutes acceptance of the new 
              terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">10. Account Deletion</h2>
            <p className="mb-3">
              You can delete your account at any time:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Contact us via email with your deletion request</li>
              <li>All personal data will be deleted within 30 days</li>
              <li>Highscores may remain anonymized on the leaderboard</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">11. Final Provisions</h2>
            <p className="mb-3">
              The law of the Federal Republic of Germany applies. Should individual provisions of these 
              terms be invalid, this does not affect the validity of the remaining provisions.
            </p>
          </section>

          <section className="pt-4 border-t border-white/20">
            <p className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString('en-US')}
            </p>
          </section>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="mt-8 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
          >
            ← Back
          </button>
        )}
      </div>
    </motion.div>
  );
}