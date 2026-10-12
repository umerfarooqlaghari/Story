'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  LifeBuoy,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  MessageSquare,
  BookOpen,
  Headphones
} from 'lucide-react'
import { API_BASE_URL } from '../../lib/config'

const CATEGORIES = [
  'General Inquiry',
  'Audio & Voice Narration',
  'Billing & Subscriptions',
  'Custom Story Generator',
  'Technical Issue & Bugs',
  'Story Suggestions'
]

const QUICK_FAQS = [
  {
    q: 'How does the free bedtime trial work?',
    a: 'Every family receives 10 complimentary minutes of pristine ElevenLabs studio audio narration before needing to subscribe or log in.'
  },
  {
    q: 'Can I listen to stories across multiple devices?',
    a: 'Yes! Your StoryTime account synchronizes bookmarks and premium access between the Web app and our iOS mobile app.'
  },
  {
    q: 'What is the standard response time for queries?',
    a: 'Our parent-first support desk reviews and responds to all inquiries within 12 hours, 7 days a week.'
  }
]

export default function SupportPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Pre-fill user email from localStorage if logged in
  useEffect(() => {
    try {
      const stored = localStorage.getItem('story_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.email) setEmail(parsed.email)
        if (parsed.name) setName(parsed.name)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setStatus('error')
      setStatusMessage('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    setStatus('idle')
    setStatusMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/support-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim()
        })
      })

      const data = await res.json()

      if (!res.ok || data.success === false) {
        throw new Error(data.detail || data.message || 'Failed to dispatch your query.')
      }

      setStatus('success')
      setStatusMessage(
        data.message ||
          'Your support query has been successfully dispatched! Our team will review and reply to your email shortly.'
      )
      // Reset form message and subject
      setSubject('')
      setMessage('')
    } catch (err: any) {
      console.error('Support submission error:', err)
      setStatus('error')
      setStatusMessage(err.message || 'Something went wrong while sending your query. Please email us directly at info@alpha-devs.cloud.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Top Utility Header */}
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
              <span>Family Support Desk</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Support Container */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Title Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold tracking-wide uppercase mb-4">
            <LifeBuoy className="w-3.5 h-3.5 text-amber-600" />
            <span>Here to Help You & Your Family</span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            StoryTime Support & Help
          </h1>

          <p className="font-serif italic text-slate-500 text-base md:text-lg max-w-2xl mx-auto">
            Need assistance with bedtime audio narration, subscription access, or custom stories? Submit your query below.
          </p>
        </div>

        {/* Quick Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Direct Inquiries</div>
              <a
                href="mailto:info@alpha-devs.cloud"
                className="font-bold text-slate-900 text-sm hover:text-amber-600 transition-colors block mt-0.5"
              >
                info@alpha-devs.cloud
              </a>
              <div className="text-[11px] text-slate-500 mt-1">Official Support Desk</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Response Speed</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">&lt; 12 Hours</div>
              <div className="text-[11px] text-slate-500 mt-1">7 Days a Week</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Voice Studio</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">ElevenLabs Ultra HD</div>
              <div className="text-[11px] text-slate-500 mt-1">Fast cached audio narration</div>
            </div>
          </div>
        </div>

        {/* Support Query Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 mb-12">
          <div className="flex items-center gap-2.5 pb-6 border-b border-slate-100 mb-6">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
              Send Us a Support Query
            </h2>
          </div>

          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3.5"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-bold mb-1">Query Sent Successfully!</div>
                  <div className="text-emerald-700 leading-relaxed text-xs sm:text-sm">
                    {statusMessage}
                  </div>
                  <div className="mt-3 text-xs text-emerald-600 font-medium">
                    Our team will reply directly to <span className="font-bold underline">{email}</span>.
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3.5"
              >
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-bold mb-1">Submission Failed</div>
                  <div className="text-rose-700 text-xs sm:text-sm">{statusMessage}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Inquiry Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audio playback paused or Billing Question"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Detailed Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                placeholder="Describe your question or issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition resize-y"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                All inquiries are dispatched securely and responded to directly by our team.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-slate-900/10"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending Query...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Query</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick FAQ Section */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QUICK_FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
              >
                <div className="font-bold text-slate-900 text-xs sm:text-sm mb-2">
                  {faq.q}
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} Bedtime Stories. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <a
              href="mailto:info@alpha-devs.cloud"
              className="hover:text-slate-600 transition-colors"
            >
              info@alpha-devs.cloud
            </a>
          </div>
        </div>

      </main>
    </div>
  )
}
