'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const lastUpdated = "6 January 2026";
  const companyName = "Zestio Tech Limited";
  const appName = "SweetAsMenu";
  const contactEmail = "support@zestiotech.com";
  const websiteUrl = "sweetasmenu.com";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-bold text-amber-600 hover:text-amber-700">
            {appName}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-gray max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                {companyName} (trading as "{appName}") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our restaurant management platform and related services.
              </p>
              <p className="text-gray-700">
                We comply with the New Zealand Privacy Act 2020 and the Information Privacy Principles (IPPs).
                By using {appName}, you consent to the practices described in this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li><strong>Account Information:</strong> Name, email address, phone number, business name</li>
                <li><strong>Restaurant Details:</strong> Business address, GST number, IRD number, menu items</li>
                <li><strong>Payment Information:</strong> Bank account details for transfers (stored securely via Stripe)</li>
                <li><strong>Staff Information:</strong> Staff names, roles, PIN codes for POS access</li>
                <li><strong>Customer Orders:</strong> Order details, delivery addresses, special instructions</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
                <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">2.3 Information from Third Parties</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li><strong>Payment Processors:</strong> Transaction confirmations from Stripe</li>
                <li><strong>Authentication:</strong> Profile data if you sign in via Google or social providers</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use collected information to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Provide and maintain our restaurant management services</li>
                <li>Process orders and payments</li>
                <li>Generate AI-powered menu translations and food images</li>
                <li>Send order notifications and service updates</li>
                <li>Provide customer support</li>
                <li>Analyse usage patterns to improve our services</li>
                <li>Comply with legal obligations (e.g., GST reporting)</li>
                <li>Detect and prevent fraud or security issues</li>
              </ul>
            </section>

            {/* AI Services */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. AI-Powered Features</h2>
              <p className="text-gray-700 mb-4">
                {appName} uses artificial intelligence (Google Gemini) to provide:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li><strong>Menu Translation:</strong> Automatic translation of menu items between languages</li>
                <li><strong>Food Image Generation:</strong> AI-generated images for menu items</li>
                <li><strong>Image Enhancement:</strong> Improving quality of uploaded food photos</li>
              </ul>
              <p className="text-gray-700">
                Menu text and descriptions may be processed by Google's AI services.
                We do not share personal customer information with AI services.
              </p>
            </section>

            {/* Data Sharing */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">We may share your information with:</p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">5.1 Service Providers</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li><strong>Supabase:</strong> Database hosting and authentication (Australia/US servers)</li>
                <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
                <li><strong>Google Cloud:</strong> AI services for translation and image generation</li>
                <li><strong>Vercel:</strong> Website hosting</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">5.2 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose information if required by New Zealand law, court order,
                or government request, including to IRD for tax compliance purposes.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">5.3 Business Transfers</h3>
              <p className="text-gray-700">
                If {companyName} is involved in a merger, acquisition, or sale of assets,
                your information may be transferred as part of that transaction.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">We retain your information for:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li><strong>Account data:</strong> Until you delete your account</li>
                <li><strong>Order history:</strong> 7 years (NZ tax record requirements)</li>
                <li><strong>Payment records:</strong> 7 years (NZ tax record requirements)</li>
                <li><strong>Usage logs:</strong> 12 months</li>
                <li><strong>AI-generated images:</strong> Until deleted by restaurant owner</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Rights (NZ Privacy Act 2020)</h2>
              <p className="text-gray-700 mb-4">Under New Zealand privacy law, you have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your information (subject to legal retention requirements)</li>
                <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for optional data processing</li>
              </ul>
              <p className="text-gray-700">
                To exercise these rights, contact us at <a href={`mailto:${contactEmail}`} className="text-amber-600 hover:underline">{contactEmail}</a>.
                We will respond within 20 working days as required by the Privacy Act.
              </p>
            </section>

            {/* Security */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Data Security</h2>
              <p className="text-gray-700 mb-4">We protect your information using:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>SSL/TLS encryption for all data in transit</li>
                <li>Encrypted database storage (Supabase with Row Level Security)</li>
                <li>Secure authentication with hashed passwords</li>
                <li>Regular security audits and updates</li>
                <li>Staff access controls and PIN-based POS authentication</li>
              </ul>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">We use cookies for:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li><strong>Essential Cookies:</strong> Required for login and security</li>
                <li><strong>Preference Cookies:</strong> Remember your language and settings</li>
                <li><strong>Analytics Cookies:</strong> Understand how you use our platform</li>
              </ul>
              <p className="text-gray-700">
                You can disable cookies in your browser settings, but some features may not work properly.
              </p>
            </section>

            {/* International Transfers */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700">
                Your data may be processed in Australia, United States, or other countries where
                our service providers operate. We ensure appropriate safeguards are in place,
                including contractual protections with our providers.
              </p>
            </section>

            {/* Children */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Children's Privacy</h2>
              <p className="text-gray-700">
                {appName} is designed for business use and is not intended for children under 16.
                We do not knowingly collect information from children.
              </p>
            </section>

            {/* Changes */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of
                significant changes via email or through the platform. Your continued use
                after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                For privacy-related questions or to exercise your rights:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Privacy Officer</strong></p>
                <p className="text-gray-700">{companyName}</p>
                <p className="text-gray-700">Email: <a href={`mailto:${contactEmail}`} className="text-amber-600 hover:underline">{contactEmail}</a></p>
                <p className="text-gray-700">Website: <a href={`https://${websiteUrl}`} className="text-amber-600 hover:underline">{websiteUrl}</a></p>
              </div>
              <p className="text-gray-700 mt-4">
                If you are not satisfied with our response, you may contact the
                <a href="https://www.privacy.org.nz" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline ml-1">
                  Office of the Privacy Commissioner
                </a>.
              </p>
            </section>
          </div>

          {/* Back Link */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link href="/" className="text-amber-600 hover:text-amber-700 font-medium">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-amber-600 text-amber-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-amber-600">Terms of Service</Link>
            <Link href="/refunds" className="hover:text-amber-600">Refund Policy</Link>
            <Link href="/contact" className="hover:text-amber-600">Contact Us</Link>
          </div>
          <p className="text-center text-sm text-gray-400 mt-4">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
