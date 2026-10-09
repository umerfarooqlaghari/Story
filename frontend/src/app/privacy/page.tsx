'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  ArrowLeft,
  Clock,
  Sparkles,
  Volume2,
  Lock,
  CreditCard,
  HeartHandshake,
  Mail,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Top Utility Bar matching Mobile Theme */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Bookshelf</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Bedtime Stories Legal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Title Header matching the mobile typography aesthetic */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold tracking-wide uppercase mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Transparency & Child Safety</span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Privacy Policy & Disclosures
          </h1>

          <p className="font-serif italic text-slate-500 text-base md:text-lg max-w-2xl mx-auto">
            Our commitment to safe bedtime storytelling, audio privacy, and transparent subscription terms.
          </p>

          <div className="mt-4 text-xs text-slate-400 font-medium">
            Effective Date: October 2026 • Applicable across Web & Mobile platforms
          </div>
        </div>

        {/* Quick Summary Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">10-Minute Free Trial</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Listen to classic stories without logging in or providing payment details. No surprise fees.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Zero Audio Recording</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We never record, sample, or access your device microphone. Audio is purely outbound AI narration.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">COPPA Compliant</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We do not knowingly collect personal data from children under 13. Accounts are managed by parents.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm">

          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">1</span>
              <h2>Children's Privacy Protection (COPPA Compliance)</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-2">
              <p>
                Bedtime Stories is created for families and young listeners. Because protecting children is our utmost priority, our application strictly complies with the <strong>Children’s Online Privacy Protection Act (COPPA)</strong> and global child protection regulations.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>We do not solicit, require, or knowingly collect any personal identifiers from children under the age of 13.</li>
                <li>All account creation, subscription payments, and email verifications must be completed by a parent or legal guardian.</li>
                <li>Children may freely enjoy our 10-minute trial and classic library in a protected, advertisement-free environment.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">2</span>
              <h2>Free Storytelling Trial & Listening Disclosures</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-2">
              <p>
                We believe parents and children should experience the quality of our narrations before committing to a paid plan:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>10-Minute Free Audio Trial:</strong> Guests receive 600 seconds of complimentary audio playback across our 20 classic children’s stories without requiring account creation or payment cards.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Trial Time Tracking:</strong> Listening duration is counted incrementally while the audio player is actively playing. When the 600-second allowance is reached, audio pauses gracefully.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>No Automated Billing:</strong> The trial never converts into an unexpected paid charge. Upgrading to Story Time PRO is always an explicit parental choice.</span>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">3</span>
              <h2>Voice Synthesis & Audio Technology (ElevenLabs)</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-2">
              <p>
                Our calming bedtime audio voices (including George, Sarah, Rachel, Charlie, and Laura) are generated using state-of-the-art voice synthesis provided by ElevenLabs:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>No Inbound Microphone Access:</strong> The app streams audio out to your speakers. We never activate your device microphone, record ambient room sound, or store children's voices.</li>
                <li><strong>Audio Caching:</strong> Pre-generated story audio variants are cached via secure cloud storage to minimize data usage and enable instantaneous, buffer-free playback.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">4</span>
              <h2>Subscriptions, Billing & Payment Processing</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-3">
              <p>
                Bedtime Stories offers premium access tiers designed to support uninterrupted family listening:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Monthly Plan</div>
                  <div className="text-xl font-black text-slate-900 mt-1">$30.00 <span className="text-xs font-normal text-slate-500">/ month</span></div>
                  <div className="text-xs text-slate-500 mt-1">Unlimited reading, custom stories, and all 5 narrator voices.</div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Yearly Plan (Best Value)</div>
                  <div className="text-xl font-black text-slate-900 mt-1">$320.00 <span className="text-xs font-normal text-slate-500">/ year</span></div>
                  <div className="text-xs text-slate-500 mt-1">Save $40 compared to monthly billing. Full annual access.</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-700" />
                  <span>Payment Security & Upcoming Stripe Processing</span>
                </div>
                <p>
                  Purchases are tracked via RevenueCat in-app subscriptions and our secure backend ledger. In addition, online web payments will be processed via <strong>Stripe</strong>. Your payment card information is securely transmitted directly to Stripe under PCI-DSS Level 1 compliance; our servers never receive, store, or have access to your full credit card numbers or security codes.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">5</span>
              <h2>Authentication, Passwords & 30-Day Sessions</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-2">
              <p>
                To provide seamless family access without cumbersome repeated logins:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>AWS SES Verification:</strong> When creating an account or resetting a forgotten password, a 6-digit one-time passcode (OTP) is dispatched to your registered parent email address via Amazon Web Services (AWS SES).</li>
                <li><strong>Password Security:</strong> Passwords are cryptographically salted and hashed using native <code>bcrypt</code> before database storage. Plaintext passwords are never saved.</li>
                <li><strong>30-Day Secure Tokens:</strong> Upon verification, users receive cryptographically signed JSON Web Tokens (JWT) that remain valid for 30 days, keeping your bedtime reading routine effortless.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">6</span>
              <h2>Data Retention, Rights & Contact Us</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-3">
              <p>
                You retain full control over your family's data. You may request a complete export of your listening preferences or complete deletion of your account at any time.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900">Privacy Officer & Support Inquiries</div>
                  <div className="text-slate-500">Contact our dedicated team for privacy requests or billing inquiries.</div>
                </div>
                <a
                  href="mailto:StoryTime@alpha-devs.cloud"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>StoryTime@alpha-devs.cloud</span>
                </a>
              </div>
            </div>
          </section>

        </div>

        {/* Back Link Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Bedtime Story Library</span>
          </Link>
        </div>

      </main>

    </div>
  )
}
