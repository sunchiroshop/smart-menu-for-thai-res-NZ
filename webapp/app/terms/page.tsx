'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
  const lastUpdated = "6 January 2026";
  const companyName = "Zestio Tech Limited";
  const appName = "SweetAsMenu";
  const contactEmail = "support@zestiotech.com";
  const supportEmail = "support@zestiotech.com";
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-gray max-w-none">
            {/* Agreement */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using {appName} (the "Service"), provided by {companyName} ("we", "us", "our"),
                you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
                do not use the Service.
              </p>
              <p className="text-gray-700">
                These Terms apply to all users, including restaurant owners, staff members,
                and customers placing orders through the platform.
              </p>
            </section>

            {/* Service Description */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                {appName} is a restaurant management platform providing:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Digital menu creation and management</li>
                <li>AI-powered menu translation</li>
                <li>AI-generated food imagery</li>
                <li>Online ordering system for customers</li>
                <li>Point of Sale (POS) system for staff</li>
                <li>Kitchen Display System (KDS)</li>
                <li>Order and payment management</li>
                <li>Analytics and reporting</li>
              </ul>
            </section>

            {/* Account Registration */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">3.1 Eligibility</h3>
              <p className="text-gray-700 mb-4">
                You must be at least 18 years old and have the legal authority to enter into
                contracts to create an account. By registering, you represent that you have
                the authority to bind your business to these Terms.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">3.2 Account Security</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Maintaining the confidentiality of your login credentials</li>
                <li>All activities that occur under your account</li>
                <li>Managing staff access and PIN codes</li>
                <li>Notifying us immediately of any unauthorized access</li>
              </ul>
            </section>

            {/* Subscription Plans */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Subscription Plans and Fees</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">4.1 Plans</h3>
              <p className="text-gray-700 mb-4">
                We offer multiple subscription tiers with different features and limits.
                Current plans and pricing are displayed on our website. All prices are in
                New Zealand Dollars (NZD) and include GST where applicable.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">4.2 Free Trial</h3>
              <p className="text-gray-700 mb-4">
                New accounts may receive a free trial period. Trial limitations include
                restricted AI usage credits and menu item limits. No payment is required
                during the trial period.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">4.3 Billing</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Subscriptions are billed monthly or annually in advance</li>
                <li>Payments are processed securely via Stripe</li>
                <li>You authorize us to charge your payment method on each billing date</li>
                <li>Failed payments may result in service suspension</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">4.4 Plan Changes</h3>
              <p className="text-gray-700">
                You may upgrade your plan at any time (prorated charges apply).
                Downgrades take effect at the next billing cycle. See our
                <Link href="/refunds" className="text-amber-600 hover:underline ml-1">Refund Policy</Link> for details.
              </p>
            </section>

            {/* AI Services */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. AI-Powered Features</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">5.1 Usage Limits</h3>
              <p className="text-gray-700 mb-4">
                AI features (translation, image generation, enhancement) are subject to
                usage limits based on your subscription plan. Limits reset monthly.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">5.2 AI Output Disclaimer</h3>
              <p className="text-gray-700 mb-4">
                AI-generated content is provided "as is". You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Reviewing and verifying translation accuracy</li>
                <li>Ensuring generated images are appropriate for your use</li>
                <li>Complying with food advertising standards</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">5.3 Watermarking</h3>
              <p className="text-gray-700">
                AI-generated and enhanced images on Free, Starter, and Professional plans
                include a "{appName}" watermark. Enterprise plans receive watermark-free images.
              </p>
            </section>

            {/* User Content */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. User Content</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">6.1 Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of content you upload (menus, logos, photos).
                By uploading content, you grant us a licence to use, display, and process
                it to provide the Service.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">6.2 Content Standards</h3>
              <p className="text-gray-700 mb-4">You agree not to upload content that:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Infringes intellectual property rights</li>
                <li>Is false, misleading, or deceptive</li>
                <li>Violates NZ food safety or advertising laws</li>
                <li>Contains malware or harmful code</li>
                <li>Is offensive, discriminatory, or illegal</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">6.3 Content Removal</h3>
              <p className="text-gray-700">
                We reserve the right to remove content that violates these Terms
                without prior notice.
              </p>
            </section>

            {/* Orders and Payments */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Orders and Payments (Restaurant Customers)</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">7.1 Order Processing</h3>
              <p className="text-gray-700 mb-4">
                {appName} facilitates orders between customers and restaurants.
                The contract of sale is between the customer and the restaurant,
                not with {companyName}.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">7.2 Payment Processing</h3>
              <p className="text-gray-700 mb-4">
                Payments are processed via Stripe. We do not store credit card numbers.
                Restaurants may apply a service fee for card payments as permitted by NZ law.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">7.3 Disputes</h3>
              <p className="text-gray-700">
                Order disputes (refunds, complaints about food quality) should be
                directed to the restaurant. We may assist in facilitating communication
                but are not responsible for restaurant performance.
              </p>
            </section>

            {/* Restaurant Responsibilities */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Restaurant Owner Responsibilities</h2>
              <p className="text-gray-700 mb-4">As a restaurant owner using {appName}, you agree to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Maintain accurate menu information and pricing</li>
                <li>Fulfil customer orders in a timely manner</li>
                <li>Comply with NZ food safety regulations</li>
                <li>Display accurate GST information if registered</li>
                <li>Handle customer data in accordance with the Privacy Act 2020</li>
                <li>Respond to customer enquiries and complaints</li>
                <li>Ensure staff are properly trained on the POS system</li>
              </ul>
            </section>

            {/* Prohibited Uses */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Prohibited Uses</h2>
              <p className="text-gray-700 mb-4">You may not use the Service to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Violate any New Zealand or international laws</li>
                <li>Commit fraud or money laundering</li>
                <li>Sell prohibited items (e.g., age-restricted goods without verification)</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Attempt to gain unauthorized access to systems</li>
                <li>Scrape or harvest data from the platform</li>
                <li>Resell the Service without authorization</li>
                <li>Use AI features to generate misleading content</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Intellectual Property</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">10.1 Our IP</h3>
              <p className="text-gray-700 mb-4">
                The {appName} platform, including its design, code, features, and branding,
                is owned by {companyName} and protected by intellectual property laws.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">10.2 AI-Generated Content</h3>
              <p className="text-gray-700">
                You are granted a licence to use AI-generated images and translations
                for your restaurant business. This licence is non-transferable and
                limited to the duration of your subscription.
              </p>
            </section>

            {/* Disclaimers */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Disclaimers</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">11.1 Service Availability</h3>
              <p className="text-gray-700 mb-4">
                The Service is provided "as is" and "as available". We do not guarantee
                uninterrupted or error-free operation. We may perform maintenance that
                temporarily affects availability.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">11.2 No Warranty</h3>
              <p className="text-gray-700">
                To the maximum extent permitted by NZ law (including the Consumer Guarantees Act),
                we disclaim all warranties, express or implied, including merchantability and
                fitness for a particular purpose.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability is limited to fees paid in the 12 months before the claim</li>
                <li>We are not responsible for restaurant performance or food quality</li>
                <li>We are not liable for losses caused by third-party services (Stripe, Google, etc.)</li>
              </ul>
              <p className="text-gray-700">
                Nothing in these Terms limits liability that cannot be excluded under NZ law,
                including under the Consumer Guarantees Act 1993.
              </p>
            </section>

            {/* Indemnification */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold harmless {companyName} from claims, damages,
                and expenses arising from your use of the Service, violation of these Terms,
                or infringement of third-party rights.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Termination</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">14.1 By You</h3>
              <p className="text-gray-700 mb-4">
                You may cancel your subscription at any time from your account settings.
                Cancellation takes effect at the end of your current billing period.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">14.2 By Us</h3>
              <p className="text-gray-700 mb-4">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Violate these Terms</li>
                <li>Fail to pay subscription fees</li>
                <li>Engage in fraudulent activity</li>
                <li>Abuse AI features or exceed usage limits</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">14.3 Effect of Termination</h3>
              <p className="text-gray-700">
                Upon termination, your access to the Service will cease. You may request
                export of your data within 30 days of termination. We may retain certain
                data as required by law.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Governing Law and Disputes</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of New Zealand. Any disputes will be
                resolved in the courts of New Zealand.
              </p>
              <p className="text-gray-700">
                Before initiating legal proceedings, you agree to attempt resolution through
                good-faith negotiation or mediation.
              </p>
            </section>

            {/* Changes */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">16. Changes to Terms</h2>
              <p className="text-gray-700">
                We may modify these Terms at any time. Material changes will be notified
                via email or platform notification at least 30 days before taking effect.
                Continued use after changes constitutes acceptance.
              </p>
            </section>

            {/* General */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">17. General Provisions</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and {companyName}.</li>
                <li><strong>Severability:</strong> If any provision is unenforceable, the remainder continues in effect.</li>
                <li><strong>Waiver:</strong> Failure to enforce a provision does not waive future enforcement.</li>
                <li><strong>Assignment:</strong> You may not assign these Terms without our consent.</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">18. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>{companyName}</strong></p>
                <p className="text-gray-700">Legal: <a href={`mailto:${contactEmail}`} className="text-amber-600 hover:underline">{contactEmail}</a></p>
                <p className="text-gray-700">Support: <a href={`mailto:${supportEmail}`} className="text-amber-600 hover:underline">{supportEmail}</a></p>
                <p className="text-gray-700">Website: <a href={`https://${websiteUrl}`} className="text-amber-600 hover:underline">{websiteUrl}</a></p>
              </div>
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
            <Link href="/privacy" className="hover:text-amber-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-amber-600 text-amber-600">Terms of Service</Link>
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
