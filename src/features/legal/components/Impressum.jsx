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
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-200">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">1. Controller</h2>
            <p>
              Responsible for data processing on this website:
            </p>
            <div className="bg-white/5 p-4 rounded-lg mt-2">
              <p>[YOUR NAME]</p>
              <p>[YOUR ADDRESS]</p>
              <p>Email: [YOUR EMAIL]</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">2. Collection and Storage of Personal Data</h2>
            <p className="mb-3">When using our game, we collect the following data:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Email Address:</strong> For creating and managing your account</li>
              <li><strong>Username:</strong> For identification on leaderboards</li>
              <li><strong>Highscore:</strong> For storing your game results</li>
              <li><strong>Password:</strong> Stored as hash (not in plain text)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">3. Legal Basis</h2>
            <p>
              Processing is based on Art. 6 para. 1 lit. b GDPR for the fulfillment 
              of the usage contract (provision of the game and account functions).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">4. Storage Duration</h2>
            <p>
              Your data is stored as long as your account is active. When deleting your 
              account, all personal data will be deleted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">5. Disclosure to Third Parties</h2>
            <p className="mb-3">We use the following external services:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Fly.io:</strong> Backend hosting (servers in [REGION])</li>
              <li><strong>Scryfall API:</strong> Provision of Magic: The Gathering card data (no personal data is transmitted)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">6. Cookies and Local Storage</h2>
            <p className="mb-3">We use the following technologies:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Local Storage:</strong> Storage of authentication token (technically necessary)</li>
              <li>This data remains local in your browser and is not transmitted to third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">7. Your Rights</h2>
            <p className="mb-3">You have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> Right to information about your stored data</li>
              <li><strong>Rectification:</strong> Right to correct incorrect data</li>
              <li><strong>Erasure:</strong> Right to delete your data ("right to be forgotten")</li>
              <li><strong>Data Portability:</strong> Right to receive your data in structured format</li>
              <li><strong>Objection:</strong> Right to object to data processing</li>
              <li><strong>Complaint:</strong> Right to lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">8. Data Security</h2>
            <p>
              We use HTTPS encryption for data transmission and store passwords 
              only as hash. However, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-purple-300">9. Contact for Privacy Inquiries</h2>
            <p>
              For questions about privacy or to exercise your rights, contact us at:
            </p>
            <div className="bg-white/5 p-4 rounded-lg mt-2">
              <p>Email: [YOUR EMAIL]</p>
            </div>
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