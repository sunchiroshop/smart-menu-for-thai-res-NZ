'use client';

import Link from 'next/link';

export default function RefundPolicyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          {/* Summary Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-amber-800 mb-2">Quick Summary</h2>
            <ul className="text-amber-700 space-y-1">
              <li>✓ 14-day money-back guarantee for new subscribers</li>
              <li>✓ Pro-rata refunds for annual plan cancellations</li>
              <li>✓ No refunds for used AI credits</li>
              <li>✓ Restaurant order refunds handled by each restaurant</li>
            </ul>
          </div>

          <div className="prose prose-gray max-w-none">
            {/* Scope */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Scope of This Policy</h2>
              <p className="text-gray-700 mb-4">
                This Refund Policy applies to subscription fees paid to {companyName} for {appName} services.
                This policy complies with the New Zealand Consumer Guarantees Act 1993.
              </p>
              <p className="text-gray-700">
                <strong>Note:</strong> Refunds for food orders placed through restaurant menus are the
                responsibility of each individual restaurant, not {companyName}.
              </p>
            </section>

            {/* Subscription Refunds */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Subscription Refunds</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 New Subscriber Guarantee (14 Days)</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800">
                  <strong>14-Day Money-Back Guarantee:</strong> If you're not satisfied with {appName}
                  within the first 14 days of your initial paid subscription, you may request a full
                  refund - no questions asked.
                </p>
              </div>
              <p className="text-gray-700 mb-4">Conditions:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Applies to first-time paid subscribers only</li>
                <li>Request must be made within 14 days of payment</li>
                <li>Applies to monthly and annual subscriptions</li>
                <li>AI credits used during this period will not affect refund eligibility</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Monthly Subscriptions</h3>
              <p className="text-gray-700 mb-4">
                After the 14-day guarantee period:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Monthly subscriptions are non-refundable</li>
                <li>You may cancel anytime; service continues until end of billing period</li>
                <li>No partial refunds for unused days within a billing cycle</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">2.3 Annual Subscriptions</h3>
              <p className="text-gray-700 mb-4">
                Annual subscription refunds (after the 14-day guarantee):
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li><strong>Within 30 days:</strong> Full refund minus the pro-rata value of days used</li>
                <li><strong>31-90 days:</strong> 75% refund of remaining unused months</li>
                <li><strong>91-180 days:</strong> 50% refund of remaining unused months</li>
                <li><strong>After 180 days:</strong> No refund; may cancel for end of term</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">2.4 Plan Downgrades</h3>
              <p className="text-gray-700">
                When downgrading to a lower-tier plan, the change takes effect at your next
                billing date. No refunds are provided for the difference between plans.
                AI credits do not carry over to the new plan.
              </p>
            </section>

            {/* AI Credits */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. AI Feature Credits</h2>
              <p className="text-gray-700 mb-4">
                AI features (image generation, enhancement, translation) use credits included in your plan:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li><strong>Credits are non-refundable</strong> once used</li>
                <li>Unused credits expire at the end of each billing month</li>
                <li>Credits do not roll over to the next period</li>
                <li>Failed AI generations (due to system errors) do not consume credits</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <strong>AI Quality Issues:</strong> If you're consistently receiving poor-quality
                  AI results, contact support. We may provide additional credits at our discretion.
                </p>
              </div>
            </section>

            {/* Restaurant Order Refunds */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Restaurant Order Refunds (For Customers)</h2>
              <p className="text-gray-700 mb-4">
                <strong>Important:</strong> {appName} is a platform connecting customers with restaurants.
                We do not sell food directly.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">4.1 Who to Contact</h3>
              <p className="text-gray-700 mb-4">
                For refunds on food orders, please contact the restaurant directly. Each restaurant
                sets their own refund policy for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Incorrect orders</li>
                <li>Food quality issues</li>
                <li>Missing items</li>
                <li>Late delivery</li>
                <li>Order cancellations</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">4.2 Payment Processing Issues</h3>
              <p className="text-gray-700 mb-4">
                If you were charged but your order wasn't received by the restaurant (payment processing error):
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Contact the restaurant first</li>
                <li>If unresolved, email <a href={`mailto:${supportEmail}`} className="text-amber-600 hover:underline">{supportEmail}</a> with your order details</li>
                <li>We will investigate and facilitate the refund through Stripe</li>
              </ul>
            </section>

            {/* Service Issues */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Service Disruption Credits</h2>
              <p className="text-gray-700 mb-4">
                If {appName} experiences significant downtime affecting your business:
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Downtime Duration</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Credit Provided</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 text-gray-700">1-4 hours</td>
                      <td className="px-4 py-2 text-gray-700">No credit</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">4-12 hours</td>
                      <td className="px-4 py-2 text-gray-700">1 day credit</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">12-24 hours</td>
                      <td className="px-4 py-2 text-gray-700">3 days credit</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">24+ hours</td>
                      <td className="px-4 py-2 text-gray-700">1 week credit</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-gray-700 mt-4">
                Credits are applied to your next billing cycle. This does not apply to scheduled
                maintenance (which we announce in advance) or issues caused by third-party services.
              </p>
            </section>

            {/* How to Request */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. How to Request a Refund</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">6.1 Subscription Refunds</h3>
              <ol className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
                <li>Email <a href={`mailto:${contactEmail}`} className="text-amber-600 hover:underline">{contactEmail}</a></li>
                <li>Include your account email and reason for refund</li>
                <li>We will respond within 2 business days</li>
                <li>Approved refunds are processed within 5-10 business days</li>
              </ol>

              <h3 className="text-lg font-medium text-gray-800 mb-2">6.2 Required Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Account email address</li>
                <li>Date of purchase</li>
                <li>Payment method (last 4 digits)</li>
                <li>Reason for refund request</li>
                <li>Order ID (for restaurant order issues)</li>
              </ul>
            </section>

            {/* Refund Methods */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Refund Methods</h2>
              <p className="text-gray-700 mb-4">
                Refunds are processed to the original payment method:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li><strong>Credit/Debit Card:</strong> Refunded to original card (5-10 business days)</li>
                <li><strong>Bank Transfer:</strong> Refunded to original account (3-5 business days)</li>
              </ul>
              <p className="text-gray-700 mt-4">
                If the original payment method is no longer available, we will arrange an alternative
                refund method.
              </p>
            </section>

            {/* Exceptions */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Non-Refundable Items</h2>
              <p className="text-gray-700 mb-4">The following are not eligible for refunds:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Used AI generation/enhancement credits</li>
                <li>Custom development or setup services</li>
                <li>Monthly subscriptions after the 14-day guarantee</li>
                <li>Accounts terminated for Terms of Service violations</li>
                <li>Free trial periods (no payment made)</li>
              </ul>
            </section>

            {/* Consumer Rights */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Your Consumer Rights (NZ Law)</h2>
              <p className="text-gray-700 mb-4">
                Under the New Zealand Consumer Guarantees Act 1993, you have rights that cannot be
                excluded by contract:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Services must be provided with reasonable care and skill</li>
                <li>Services must be fit for purpose</li>
                <li>Services must be provided within a reasonable time</li>
              </ul>
              <p className="text-gray-700">
                If we fail to meet these guarantees, you may be entitled to a remedy (repair, redo,
                or refund) regardless of this policy. Nothing in this policy limits your statutory rights.
              </p>
            </section>

            {/* Disputes */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Disputes</h2>
              <p className="text-gray-700 mb-4">
                If you're not satisfied with our refund decision:
              </p>
              <ol className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
                <li>Email <a href={`mailto:${contactEmail}`} className="text-amber-600 hover:underline">{contactEmail}</a> requesting escalation</li>
                <li>A senior team member will review within 5 business days</li>
                <li>If still unresolved, you may contact the <a href="https://www.consumerprotection.govt.nz" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Consumer Protection NZ</a></li>
                <li>You may also seek resolution through the Disputes Tribunal (claims up to $30,000)</li>
              </ol>
            </section>

            {/* Changes */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Refund Policy from time to time. Changes will be posted on this
                page with an updated "Last updated" date. Material changes affecting your existing
                subscription will be notified via email.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                For refund requests or billing questions:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Billing Department</strong></p>
                <p className="text-gray-700">{companyName}</p>
                <p className="text-gray-700">Email: <a href={`mailto:${contactEmail}`} className="text-amber-600 hover:underline">{contactEmail}</a></p>
                <p className="text-gray-700">Support: <a href={`mailto:${supportEmail}`} className="text-amber-600 hover:underline">{supportEmail}</a></p>
                <p className="text-gray-700">Website: <a href={`https://${websiteUrl}`} className="text-amber-600 hover:underline">{websiteUrl}</a></p>
              </div>
              <p className="text-gray-700 mt-4 text-sm">
                Response time: Within 2 business days (Monday-Friday, NZ time)
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
            <Link href="/privacy" className="hover:text-amber-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-amber-600">Terms of Service</Link>
            <Link href="/refunds" className="hover:text-amber-600 text-amber-600">Refund Policy</Link>
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
