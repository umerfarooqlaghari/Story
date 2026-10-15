'use client'

import React from 'react'
import Link from 'next/link'
import {
  FileText,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  XCircle,
  HelpCircle,
  Mail,
  ExternalLink,
  BookOpen,
  Headphones,
  Sliders
} from 'lucide-react'

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Top Utility Bar matching Mobile & Web Theme */}
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
            <Link
              href="/privacy"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:inline"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <Link
              href="/support"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:inline"
            >
              Support
            </Link>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Bedtime Stories Legal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Title Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold tracking-wide uppercase mb-4">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>App Store & EULA Compliant</span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Terms of Service & EULA
          </h1>

          <p className="font-serif italic text-slate-500 text-base md:text-lg max-w-2xl mx-auto">
            End User License Agreement, Auto-Renewable Subscription Disclosures, and Service Terms for Bedtime Kids Story Teller.
          </p>

          <div className="mt-4 text-xs text-slate-400 font-medium">
            Effective Date: October 2026 • Applicable across iOS Mobile & Web Platforms
          </div>
        </div>

        {/* Quick Summary Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Standard Apple EULA</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Governed by Apple’s Standard Licensed Application EULA with family-friendly usage guidelines.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Auto-Renewing Plans</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Story Time Pro Monthly ($30/mo) and Yearly ($320/yr). Clear renewal terms with zero hidden fees.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Manage & Cancel Anytime</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Turn off auto-renewal at any time in your iOS Device Settings or App Store Account without penalties.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm">

          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">1</span>
              <h2>Acceptance of Terms & Standard Apple EULA</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-3">
              <p>
                Welcome to <strong>Bedtime Kids Story Teller</strong> (&quot;StoryTime&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By downloading, accessing, or using our mobile application on iOS or our web application, you (&quot;User&quot; or &quot;Parent/Guardian&quot;) agree to be legally bound by these Terms of Service (&quot;Terms&quot;), our <Link href="/privacy" className="text-indigo-600 underline font-medium">Privacy Policy</Link>, and the terms established herein.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Apple Standard End User License Agreement (EULA) Incorporation</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  For users downloading Bedtime Kids Story Teller from the Apple App Store, this agreement incorporates by reference Apple&apos;s Standard Licensed Application End User License Agreement (EULA) accessible at{' '}
                  <a
                    href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline font-semibold"
                  >
                    https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
                  </a>. These terms supplement Apple&apos;s Standard EULA to specify features, subscription mechanics, and child safety commitments.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 2 - Guideline 3.1.2 Specific Disclosures */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs text-amber-800 font-mono font-bold">2</span>
              <h2>Auto-Renewable Subscriptions & Billing Disclosures (App Store Guideline 3.1.2)</h2>
            </div>
            
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-4">
              <p>
                Bedtime Kids Story Teller offers auto-renewable in-app subscriptions under the <strong>Story Time Pro</strong> tier to provide unrestricted access to our audio storytelling and AI generation features. In accordance with Apple App Store Review Guideline 3.1.2, the full terms and disclosures of our auto-renewing subscriptions are set forth below:
              </p>

              {/* Subscription Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Tier</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-[10px] font-semibold">Flexible</span>
                  </div>
                  <div className="text-lg font-black text-slate-900">Story Time Pro Monthly (/mo)</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    $30.00 <span className="text-xs font-normal text-slate-500">/ month</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Billed every month. Includes unlimited audio playback across 20 classic stories, all 5 ElevenLabs narrator voices, and unlimited custom bedtime story generation.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Annual Tier</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold">Save $40/yr</span>
                  </div>
                  <div className="text-lg font-black text-slate-900">Story Time Pro Yearly (/yr)</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    $320.00 <span className="text-xs font-normal text-slate-500">/ year</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Billed annually ($26.67/month equivalent). Complete unrestricted family access for 12 months with priority access to newly published bedtime tales.
                  </p>
                </div>
              </div>

              {/* Explicit Auto-Renewal & Payment Terms */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 space-y-2.5">
                <div className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-700" />
                  <span>Important Auto-Renewal & Charging Terms</span>
                </div>
                <ul className="space-y-2 pl-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                    <span><strong>Payment:</strong> Payment will be charged to your Apple ID Account at confirmation of purchase.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                    <span><strong>Automatic Renewal:</strong> Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current billing cycle.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                    <span><strong>Renewal Charge:</strong> Your Apple ID account will be charged for renewal within 24 hours prior to the end of the current period at the then-current subscription rate ($30.00/mo or $320.00/yr).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                    <span><strong>No Double Billing:</strong> Purchases are managed through Apple&apos;s StoreKit &amp; RevenueCat infrastructure to guarantee synchronization across all your iOS devices.</span>
                  </li>
                </ul>
              </div>

              {/* How to Cancel Step-by-Step */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-700" />
                  <span>How to Manage or Cancel Your Subscription (iOS)</span>
                </div>
                <p className="text-xs text-slate-600">
                  You can manage your subscriptions and turn off auto-renewal at any time by accessing your Apple ID Account Settings after purchase. Follow these simple steps:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>Open the <strong>Settings</strong> app on your iPhone or iPad.</li>
                  <li>Tap your <strong>Name / Apple ID profile</strong> at the top of the screen.</li>
                  <li>Tap <strong>Subscriptions</strong>.</li>
                  <li>Select <strong>Bedtime Kids Story Teller</strong> (or <strong>Story Time Pro</strong>).</li>
                  <li>Tap <strong>Cancel Subscription</strong> (or <strong>Cancel Free Trial</strong>) to confirm.</li>
                </ol>
                <p className="text-[11px] text-slate-500 italic">
                  Note: If you cancel, your subscription will remain active until the end of your current paid billing period, allowing you and your child to continue enjoying Story Time Pro without interruption until that date.
                </p>
              </div>

              {/* Free Trial Terms & Disclosures */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 text-sm">Free Trial Policy</h4>
                <p className="text-slate-600">
                  New users receive <strong>10 complimentary minutes (600 seconds)</strong> of studio-quality ElevenLabs audio playback across our 20 classic children’s stories. The free trial does not require entering payment details or signing up for a subscription.
                </p>
                <p className="text-slate-600">
                  Any unused portion of a free trial period, if offered, will be forfeited when the user purchases a subscription to that publication, where applicable.
                </p>
              </div>

              {/* Refund Policy */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 text-sm">Refund Inquiries</h4>
                <p className="text-slate-600">
                  All in-app purchases and auto-renewable subscriptions made through the iOS application are processed directly by Apple. If you wish to request a refund, please visit Apple&apos;s support page at{' '}
                  <a
                    href="https://reportaproblem.apple.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline font-medium"
                  >
                    reportaproblem.apple.com
                  </a>.
                </p>
              </div>

            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">3</span>
              <h2>Parental Supervision & Children&apos;s Safety (COPPA)</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-2">
              <p>
                Bedtime Kids Story Teller is designed for young children and families. In strict accordance with the Children&apos;s Online Privacy Protection Act (COPPA):
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>All user account registration, subscription purchases, and payment confirmations must be conducted solely by a parent, legal guardian, or authorized adult aged 18 or older.</li>
                <li>We do not knowingly collect personal identifiers, email addresses, or location data from children under 13.</li>
                <li>Children may listen to the classic story library and AI bedtime stories in a safe, peaceful environment free from third-party advertising.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">4</span>
              <h2>AI Voice Synthesis & Bedtime Story Content</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-2">
              <p>
                Our calming bedtime narrator voices (George, Sarah, Rachel, Charlie, and Laura) are generated via cutting-edge AI speech synthesis provided by ElevenLabs:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Outbound Audio Playback Only:</strong> Our application streams audio directly to your device speakers. We never request microphone permissions or record audio in your household.</li>
                <li><strong>Child-Friendly Content Guidelines:</strong> Stories generated via our AI bedtime generator are filtered to maintain comforting, gentle, and child-safe storytelling suitable for sleep routines.</li>
                <li><strong>Public Domain Adaptations:</strong> Our classic library tales are curated and adapted from traditional folklore, fairy tales, and public domain literature.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">5</span>
              <h2>Intellectual Property & Permitted Use</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-2">
              <p>
                Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use Bedtime Kids Story Teller for personal, non-commercial family entertainment:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>You may not reproduce, decompile, reverse-engineer, distribute, broadcast, or commercially exploit any synthesized audio tracks, code, or visual assets.</li>
                <li>All trademarks, design elements, animations, and proprietary software remain the exclusive intellectual property of the developers and Alpha-Devs.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">6</span>
              <h2>Disclaimer of Warranties & Limitation of Liability</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-2">
              <p>
                The application and all audio content are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. To the maximum extent permitted under applicable law and Apple&apos;s Standard EULA, neither we nor our affiliates shall be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.
              </p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 7 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-mono">7</span>
              <h2>Support, Privacy & Legal Contact</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed pl-8 space-y-3">
              <p>
                If you have any questions regarding these Terms, your subscription status, or parental controls, please contact our support desk:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900">Bedtime Kids Story Teller Support Team</div>
                  <div className="text-slate-500">Fast assistance for subscriptions, account management, and story feedback.</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/support"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-medium hover:bg-amber-100 transition-colors"
                  >
                    <span>Support Portal</span>
                  </Link>
                  <a
                    href="mailto:info@alpha-devs.cloud"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>info@alpha-devs.cloud</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Back Link Footer */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Bedtime Story Library</span>
          </Link>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>View Privacy Policy</span>
          </Link>
        </div>

      </main>

    </div>
  )
}
