'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Loader2, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const companyName = "Zestio Tech Limited";
  const appName = "SweetAsMenu";
  const contactEmail = "support@zestiotech.com";
  const salesEmail = "sales@zestiotech.com";
  const phone = "+64 22 123 4567";
  const address = "Auckland, New Zealand";
  const websiteUrl = "sweetasmenu.com";

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      // Simulate sending (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In production, send to your backend API
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      setSent(true);
      setFormData({ name: '', email: '', subject: 'general', message: '' });
    } catch (err) {
      setError('Failed to send message. Please try again or email us directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-bold text-amber-600 hover:text-amber-700">
            {appName}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-amber-100">
            We&apos;re here to help your restaurant succeed
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
            <p className="text-gray-600 mb-8">
              Have questions about {appName}? Want to learn how we can help your restaurant?
              We&apos;d love to hear from you. Reach out through any of the channels below.
            </p>

            {/* Contact Cards */}
            <div className="space-y-4">
              {/* Email Support */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Mail className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
                    <p className="text-gray-600 text-sm mb-2">For general inquiries and support</p>
                    <a href={`mailto:${contactEmail}`} className="text-amber-600 hover:text-amber-700 font-medium">
                      {contactEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Sales */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Sales & Partnerships</h3>
                    <p className="text-gray-600 text-sm mb-2">For pricing and business inquiries</p>
                    <a href={`mailto:${salesEmail}`} className="text-green-600 hover:text-green-700 font-medium">
                      {salesEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                    <p className="text-gray-600 text-sm mb-2">Mon-Fri, 9am-5pm NZST</p>
                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-blue-600 hover:text-blue-700 font-medium">
                      {phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                    <p className="text-gray-600 text-sm mb-2">{companyName}</p>
                    <p className="text-purple-600 font-medium">{address}</p>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                    <p className="text-gray-600 text-sm">Monday - Friday: 9:00 AM - 5:00 PM (NZST)</p>
                    <p className="text-gray-600 text-sm">Saturday - Sunday: Closed</p>
                    <p className="text-orange-600 text-sm mt-2">* Email support available 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h2>
              <p className="text-gray-600 mb-6">
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>

              {sent ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for contacting us. We&apos;ll respond to your inquiry soon.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                      placeholder="john@restaurant.co.nz"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales & Pricing</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="feedback">Feedback & Suggestions</option>
                      <option value="billing">Billing Question</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* FAQ Link */}
            <div className="mt-6 p-6 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="font-semibold text-gray-900 mb-2">Looking for quick answers?</h3>
              <p className="text-gray-600 text-sm mb-3">
                Check out our documentation and frequently asked questions.
              </p>
              <Link href="/pricing" className="text-amber-600 hover:text-amber-700 font-medium text-sm">
                View Pricing & Plans &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mb-4">
            <Link href="/privacy" className="hover:text-amber-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-amber-600">Terms of Service</Link>
            <Link href="/refunds" className="hover:text-amber-600">Refund Policy</Link>
            <Link href="/contact" className="hover:text-amber-600 text-amber-600">Contact Us</Link>
          </div>
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
