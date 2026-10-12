'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { API_BASE_URL } from '../lib/config'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  BookOpen,
  Play,
  Pause,
  Crown,
  CheckCircle2,
  Volume2,
  X,
  Mail,
  Lock,
  ArrowRight,
  Clock,
  Search,
  ChevronRight,
  ShieldCheck,
  User,
  LogOut,
  RefreshCw,
  Timer,
  FileText,
  Menu,
  Moon,
  Sun,
  HelpCircle,
  MessageSquare,
  Headphones,
  Bookmark,
  Trash2
} from 'lucide-react'
import {
  saveStoryBookmark,
  deleteStoryBookmark,
  getAllBookmarks,
  addBookmarkListener,
  formatBookmarkTime,
  StoryBookmark
} from '../lib/bookmarks'

// Curated 5 ElevenLabs voices
const VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Warm & Captivating Storyteller", tag: "Storyteller" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Gentle, Reassuring & Soothing", tag: "Bedtime" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Calm, Soft & Gentle", tag: "Classic" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Deep & Whimsical", tag: "Adventure" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Playful & Vibrant Narrator", tag: "Playful" }
]

import { STORY_COVERS, DEFAULT_COVER } from '../lib/storyCovers'

const CATEGORY_CONFIG: Record<string, { acrylicColor: string; acrylicBorder: string }> = {
  'Fairy Tales': {
    acrylicColor: 'rgba(245, 158, 11, 0.42)', // Amber glass
    acrylicBorder: 'rgba(251, 191, 36, 0.55)'
  },
  'Bedtime Classics': {
    acrylicColor: 'rgba(59, 130, 246, 0.40)', // Ocean blue glass
    acrylicBorder: 'rgba(147, 197, 253, 0.55)'
  },
  'Adventure & Magic': {
    acrylicColor: 'rgba(255, 255, 255, 0.65)', // Frosted pearl glass
    acrylicBorder: 'rgba(255, 255, 255, 0.85)'
  },
  'Fables & Legends': {
    acrylicColor: 'rgba(239, 68, 68, 0.42)', // Ruby red glass
    acrylicBorder: 'rgba(254, 202, 202, 0.60)'
  }
}

interface Story {
  id: string
  title: string
  category: string
  author: string
  content: string
  is_classic: boolean
  audio_url?: string
}

export default function Home() {
  const [stories, setStories] = useState<Story[]>([])
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id)
  const [readingStory, setReadingStory] = useState<Story | null>(null)

  // Audio Playback State
  const [playingStoryId, setPlayingStoryId] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Trial & Subscription State (10-minute trial = 600 seconds)
  const [trialSecondsRemaining, setTrialSecondsRemaining] = useState(600)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null)

  // Modals
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isNightMode, setIsNightMode] = useState(false)
  const [isFaqsOpen, setIsFaqsOpen] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false)
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0)

  // Bookmarks State & Auto-save ref
  const [bookmarks, setBookmarks] = useState<Record<string, StoryBookmark>>({})
  const lastSavedWebTime = useRef(0)

  // Custom Story Generator Form
  const [customTheme, setCustomTheme] = useState('')
  const [generatingCustom, setGeneratingCustom] = useState(false)

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'otp' | 'forgot' | 'forgot_otp'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authConfirmPassword, setAuthConfirmPassword] = useState('')
  const [authOtpCode, setAuthOtpCode] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  // User state
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)

  // Live Password Validation Checks
  const hasPassword = authPassword.length > 0
  const isPasswordLengthValid = authPassword.length >= 6
  const hasConfirmPassword = authConfirmPassword.length > 0
  const doPasswordsMatch = hasConfirmPassword && authPassword === authConfirmPassword
  const isPasswordMismatch = hasConfirmPassword && authPassword !== authConfirmPassword

  // Load session & stories & bookmarks on mount
  useEffect(() => {
    fetchStories()
    setBookmarks(getAllBookmarks())

    const unsubBookmarks = addBookmarkListener((updated: Record<string, StoryBookmark>) => {
      setBookmarks(updated)
    })

    // 1. Load cached auth session
    try {
      const savedUser = localStorage.getItem('story_user')
      if (savedUser) {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
        fetchSubscriptionStatus(parsed.id)
      } else {
        fetchSubscriptionStatus('guest_device_user')
      }
    } catch {
      fetchSubscriptionStatus('guest_device_user')
    }

    return () => unsubBookmarks()
  }, [])

  // 10-Minute Free Trial Countdown Timer during active playback
  useEffect(() => {
    let interval: any = null
    if (isPlaying && !isSubscribed) {
      interval = setInterval(() => {
        setTrialSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (audioRef.current) audioRef.current.pause()
            setIsPlaying(false)
            clearInterval(interval)
            setIsUpgradeOpen(true)
            return 0
          }
          const next = prev - 1
          // Periodically sync with backend
          if (next % 10 === 0) {
            const userId = user?.id || 'guest_device_user'
            fetch(`${API_BASE_URL}/api/update-trial-time`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, seconds_listened: 10 })
            }).catch(() => {})
          }
          return next
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, isSubscribed, user])

  const fetchSubscriptionStatus = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscription-status?user_id=${userId}`)
      const data = await res.json()
      if (data.is_premium) {
        setIsSubscribed(true)
        setSubscriptionPlan(data.subscription_plan)
      }
      if (typeof data.trial_seconds_remaining === 'number') {
        setTrialSecondsRemaining(data.trial_seconds_remaining)
      }
    } catch (e) {
      console.log('Error checking subscription:', e)
    }
  }

  const fetchStories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stories`)
      const data = await res.json()
      if (data && data.stories) {
        setStories(data.stories)
      }
    } catch (e) {
      console.error("Failed to load stories:", e)
    }
  }

  const formatTrialTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Handle Audio Generation / Playback
  const handlePlayToggle = async (story: Story, overrideVoice?: string) => {
    const voiceToUse = overrideVoice || selectedVoice

    if (!isSubscribed && trialSecondsRemaining <= 0) {
      setIsUpgradeOpen(true)
      return
    }

    if (playingStoryId === story.id && audioRef.current && !overrideVoice) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
      return
    }

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }

    // New story audio request
    setPlayingStoryId(story.id)
    setAudioLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/get-or-generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: story.id,
          voice_id: voiceToUse,
          text_content: story.content
        })
      })
      const data = await res.json()
      if (data.audio_url) {
        setAudioUrl(data.audio_url)
        if (audioRef.current) {
          audioRef.current.src = data.audio_url
          const existing = bookmarks[story.id]
          if (existing && existing.audioPosition > 3) {
            audioRef.current.currentTime = existing.audioPosition
          }
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
        }
      }
    } catch (err) {
      console.error("Audio error:", err)
      alert("Audio generation currently unavailable. Please try again.")
    } finally {
      setAudioLoading(false)
    }
  }

  const handleVoiceChange = (newVoiceId: string) => {
    setSelectedVoice(newVoiceId)
    if (playingStoryId) {
      const currentStory = stories.find(s => s.id === playingStoryId) || readingStory
      if (currentStory) {
        handlePlayToggle(currentStory, newVoiceId)
      }
    }
  }

  // Auth Handlers
  const handleSignUpRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthMessage(null)

    if (authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.")
      return
    }

    setAuthLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword.trim(),
          confirm_password: authConfirmPassword.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Signup request failed.")

      setAuthMessage(`Verification code sent via AWS SES to ${authEmail.trim()}.`)
      setAuthMode('otp')
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthMessage(null)
    setAuthLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim(),
          otp_code: authOtpCode.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Invalid OTP code.")

      setUser(data.user)
      localStorage.setItem('story_user', JSON.stringify(data.user))
      if (data.tokens?.access_token) {
        localStorage.setItem('story_access_token', data.tokens.access_token)
      }

      setIsAuthOpen(false)
      fetchSubscriptionStatus(data.user.id)
      alert(`Welcome ${data.user.email}! You are automatically logged in with a 30-day session.`)
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthMessage(null)
    setAuthLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Login failed.")

      setUser(data.user)
      localStorage.setItem('story_user', JSON.stringify(data.user))
      if (data.tokens?.access_token) {
        localStorage.setItem('story_access_token', data.tokens.access_token)
      }

      setIsAuthOpen(false)
      fetchSubscriptionStatus(data.user.id)
      alert(`Welcome back, ${data.user.email}!`)
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = () => {
    setUser(null)
    setIsSubscribed(false)
    setSubscriptionPlan(null)
    localStorage.removeItem('story_user')
    localStorage.removeItem('story_access_token')
    fetchSubscriptionStatus('guest_device_user')
  }

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    const userId = user?.id || 'guest_device_user'
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          plan: plan
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setIsSubscribed(true)
        setSubscriptionPlan(plan)
        setIsUpgradeOpen(false)
        alert(`Welcome to Story Time PRO! You are subscribed to the ${plan.toUpperCase()} plan. All stories and voices are unlocked!`)
      }
    } catch {
      setIsSubscribed(true)
      setSubscriptionPlan(plan)
      setIsUpgradeOpen(false)
    }
  }

  // Custom AI Story Generation
  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTheme.trim()) return

    setGeneratingCustom(true)
    try {
      const res = await fetch(`${API_BASE_URL}/generate-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: customTheme.trim(),
          voice_id: selectedVoice,
          user_id: user?.id || 'guest_device_user',
          is_premium: isSubscribed
        })
      })
      const data = await res.json()
      if (data.story_id || data.title) {
        fetchStories()
        setIsGenerateOpen(false)
        setCustomTheme('')
        alert(`New story "${data.title}" added to your bookshelf!`)
      }
    } catch (e) {
      alert("Could not generate story at this time.")
    } finally {
      setGeneratingCustom(false)
    }
  }

  // Organize the 20 classic stories into the 4 mobile bookshelf categories
  const categories = ['Fairy Tales', 'Bedtime Classics', 'Adventure & Magic', 'Fables & Legends']
  const groupedShelves: Record<string, Story[]> = {
    'Fairy Tales': [],
    'Bedtime Classics': [],
    'Adventure & Magic': [],
    'Fables & Legends': []
  }

  stories.forEach((s) => {
    const cat = s.category || 'Fairy Tales'
    if (groupedShelves[cat]) {
      groupedShelves[cat].push(s)
    } else {
      groupedShelves['Fairy Tales'].push(s)
    }
  })

  return (
    <div className={`min-h-screen ${isNightMode ? 'bg-slate-950 text-slate-100 selection:bg-indigo-900 selection:text-indigo-200' : 'bg-white text-slate-900 selection:bg-amber-100 selection:text-amber-900'} font-sans pb-28 transition-colors duration-300`}>

      {/* Hidden Audio Player instance */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false)
          if (playingStoryId) {
            deleteStoryBookmark(playingStoryId)
          }
        }}
        onPause={() => {
          setIsPlaying(false)
          if (playingStoryId && audioRef.current) {
            const cur = audioRef.current.currentTime
            const dur = audioRef.current.duration || 0
            if (cur > 2) {
              const currentStory = stories.find((s) => s.id === playingStoryId)
              saveStoryBookmark({
                storyId: playingStoryId,
                storyTitle: currentStory?.title,
                audioPosition: cur,
                audioDuration: dur,
                voiceId: selectedVoice
              })
            }
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={() => {
          if (audioRef.current && playingStoryId) {
            const cur = audioRef.current.currentTime
            const dur = audioRef.current.duration || 0
            if (cur > 2 && Math.abs(cur - lastSavedWebTime.current) >= 4) {
              lastSavedWebTime.current = cur
              const currentStory = stories.find((s) => s.id === playingStoryId)
              saveStoryBookmark({
                storyId: playingStoryId,
                storyTitle: currentStory?.title,
                audioPosition: cur,
                audioDuration: dur,
                voiceId: selectedVoice
              })
            }
          }
        }}
      />

      {/* TOP UTILITY HEADER BAR - matching Mobile Header exactly */}
      <header className={`sticky top-0 z-40 ${isNightMode ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-100'} backdrop-blur-md border-b transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Left Actions: Hamburger Menu & User Profile Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-full ${isNightMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-750' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer`}
              title="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-700" />
                  <span>{user.email.split('@')[0]}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setIsAuthOpen(true) }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign In</span>
              </button>
            )}

            {/* Voice Narrator Selector */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 text-xs">
              <Volume2 className="w-3.5 h-3.5 text-amber-600" />
              <select
                value={selectedVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                {VOICES.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.tag})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Action Group: Privacy Link & PRO/Trial Badge */}
          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Privacy & Disclosures</span>
            </Link>

            <button
              onClick={() => setIsUpgradeOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-sm cursor-pointer ${isSubscribed
                  ? "bg-slate-950 text-white"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
            >
              {isSubscribed ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>PRO UNLIMITED</span>
                </>
              ) : (
                <>
                  <Timer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Free Trial: {formatTrialTime(trialSecondsRemaining)}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* MAIN BRANDING HEADER - identical to mobile screen */}
      <section className="pt-8 pb-4 text-center">
        <h2 className="font-serif italic text-slate-500 text-lg md:text-xl tracking-wide">
          My Favourite
        </h2>
        <h1 className="font-serif text-4xl md:text-6xl font-black tracking-tight text-slate-950 mt-1 uppercase">
          BOOKS
        </h1>
      </section>

      {/* BOOKSHELVES WITH ACRYLIC GLASS SHELF RAILINGS & METALLIC SCREW RIVETS */}
      <main className="max-w-6xl mx-auto px-6 space-y-12 mt-6">
        {categories.map((category) => {
          const books = groupedShelves[category] || []
          const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Fairy Tales']

          return (
            <div key={category} className="space-y-4">
              
              {/* Category Header Row */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {category}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <span>{books.length} books</span>
                  <span className="text-slate-300 font-mono text-sm tracking-widest">‹   ›</span>
                </div>
              </div>

              {/* Bookshelf Container */}
              <div className="relative pt-2 pb-6">
                
                {/* Horizontal Scrolling Books Row */}
                <div className="flex items-end gap-6 overflow-x-auto pb-8 pt-4 px-2 scrollbar-none snap-x">
                  {books.map((book) => {
                    const style = STORY_COVERS[book.title] || DEFAULT_COVER
                    const isBookPlaying = playingStoryId === book.id && isPlaying
                    const bookmark = bookmarks[book.id] || bookmarks[book.title]

                    return (
                      <motion.div
                        key={book.id}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="relative shrink-0 w-44 md:w-48 h-64 md:h-72 rounded-lg flex flex-col justify-between shadow-2xl cursor-pointer select-none overflow-hidden snap-start book-shadow border border-white/10"
                        style={{ backgroundColor: style.bgColor }}
                        onClick={() => handlePlayToggle(book)}
                      >
                        {/* High-Resolution Storybook Cover Artwork */}
                        <img
                          src={style.imageUrl}
                          alt={book.title}
                          className="absolute inset-y-0 left-3.5 right-1 w-[calc(100%-18px)] h-full object-cover opacity-90"
                        />

                        {/* Atmospheric Vignette & Gradient Overlays */}
                        <div
                          className="absolute inset-y-0 left-3.5 right-1 opacity-25 pointer-events-none"
                          style={{ backgroundColor: style.bgColor }}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />

                        {/* Gilded Victorian Gold Frame */}
                        <div
                          className="absolute inset-2 left-5 border rounded-sm p-3 flex flex-col justify-between pointer-events-none z-10"
                          style={{ borderColor: style.goldFoil || '#fbbf24' }}
                        >
                          {/* Corner Accents */}
                          <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: style.goldFoil || '#fbbf24' }} />
                          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor: style.goldFoil || '#fbbf24' }} />
                          <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor: style.goldFoil || '#fbbf24' }} />
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: style.goldFoil || '#fbbf24' }} />

                          {/* Top Foil Stamp */}
                          <div className="text-center">
                            <span
                              className="text-[8px] font-black tracking-widest uppercase text-shadow-sm"
                              style={{ color: style.goldFoil || '#fbbf24' }}
                            >
                              ★ {book.category.toUpperCase()} ★
                            </span>
                          </div>

                          {/* Book Title & Subtitle Plate */}
                          <div className="mt-auto space-y-0.5">
                            <h4
                              className="font-serif font-black text-sm md:text-base leading-tight tracking-tight drop-shadow-md line-clamp-2"
                              style={{ color: style.textColor }}
                            >
                              {book.title}
                            </h4>
                            {style.subtitle && (
                              <p className="text-[10px] italic font-medium leading-tight text-white/90 drop-shadow line-clamp-1" style={{ color: style.accentColor }}>
                                {style.subtitle}
                              </p>
                            )}
                            <p
                              className="text-[9px] font-bold tracking-wider uppercase drop-shadow"
                              style={{ color: style.goldFoil || '#fef08a' }}
                            >
                              {book.author?.toUpperCase() || 'CLASSIC TALE'}
                            </p>
                          </div>
                        </div>

                        {/* Realistic Crimson Satin Bookmark Ribbon for in-progress stories */}
                        {bookmark && bookmark.audioPosition > 3 && (
                          <div className="absolute -top-0.5 left-6 z-30 flex flex-col items-center pointer-events-none drop-shadow-lg">
                            <div className="w-5 h-9 bg-rose-700 rounded-t-sm flex items-center justify-center pt-1 relative overflow-hidden shadow-md">
                              <div className="absolute inset-y-0 left-0.5 w-1 bg-white/35" />
                              <Bookmark className="w-2.5 h-2.5 text-amber-200 fill-amber-200" />
                            </div>
                            <div className="w-5 h-2 flex">
                              <div className="w-2.5 h-2 bg-rose-700 rounded-br-sm" />
                              <div className="w-2.5 h-2 bg-rose-700 rounded-bl-sm" />
                            </div>
                            <div className="mt-0.5 bg-slate-950/95 text-amber-200 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-300/50 tracking-wider shadow">
                              {formatBookmarkTime(bookmark.audioPosition)}
                            </div>
                          </div>
                        )}

                        {/* Realistic Left Bound Leather Spine with Gold Ribs */}
                        <div
                          className="absolute inset-y-0 left-0 w-3.5 flex flex-col justify-around items-center py-6 border-r border-black/40 z-20 shadow-md"
                          style={{ backgroundColor: style.spineColor || '#0b1320' }}
                        >
                          <div className="w-2 h-0.5 rounded-full bg-amber-400/60" />
                          <div className="w-2 h-0.5 rounded-full bg-amber-400/60" />
                          <div className="w-2 h-0.5 rounded-full bg-amber-400/60" />
                        </div>
                        {/* Spine Hinge Groove Shadow */}
                        <div className="absolute inset-y-0 left-3.5 w-1 bg-black/40 z-20 pointer-events-none" />

                        {/* 3D Stacked Page Rim along the right edge */}
                        <div className="absolute inset-y-1 right-0 w-1 bg-amber-50/90 border-l border-black/20 z-10" />

                        {/* Bottom Play & Read Action Controls */}
                        <div className="relative z-30 pl-5 pr-2 pt-2 flex items-center justify-between pointer-events-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setReadingStory(book)
                            }}
                            className="text-[11px] font-bold text-white/90 hover:text-white underline decoration-white/50 backdrop-blur-xs py-0.5 px-1 rounded"
                          >
                            Read text
                          </button>

                          <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:scale-110 flex items-center justify-center text-white transition shadow-lg">
                            {audioLoading && playingStoryId === book.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : isBookPlaying ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            )}
                          </div>
                        </div>

                        {/* Diagonal Varnish Sheen Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />
                      </motion.div>
                    )
                  })}
                </div>

                {/* THE SIGNATURE ACRYLIC / GLASS SHELF RAILING WITH METALLIC SCREW RIVETS */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 rounded-xl border flex items-center justify-between px-6 backdrop-blur-md acrylic-shelf-shadow"
                  style={{
                    backgroundColor: config.acrylicColor,
                    borderColor: config.acrylicBorder
                  }}
                >
                  {/* Left Metallic Screw Rivet */}
                  <div className="w-4 h-4 rounded-full bg-slate-300 border border-slate-400 shadow-inner flex items-center justify-center">
                    <div className="w-2.5 h-[1.5px] bg-slate-500 rotate-45" />
                  </div>

                  {/* Right Metallic Screw Rivet */}
                  <div className="w-4 h-4 rounded-full bg-slate-300 border border-slate-400 shadow-inner flex items-center justify-center">
                    <div className="w-2.5 h-[1.5px] bg-slate-500 -rotate-45" />
                  </div>
                </div>

              </div>
            </div>
          )
        })}
      </main>

      {/* FLOATING ACTION PILL - "Add Books" button identical to mobile screenshot */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsGenerateOpen(true)}
          className="px-8 py-3.5 rounded-full bg-slate-950 text-white font-bold text-sm tracking-wide shadow-xl shadow-slate-900/20 hover:bg-slate-900 transition flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Add Books</span>
        </motion.button>
      </div>

      {/* FLOATING AUDIO CONTROLLER (When actively playing) */}
      <AnimatePresence>
        {playingStoryId && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {stories.find(s => s.id === playingStoryId)?.title}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Voice: {VOICES.find(v => v.id === selectedVoice)?.name}</span>
                  {!isSubscribed && (
                    <span className="text-emerald-600 font-semibold">
                      • Trial: {formatTrialTime(trialSecondsRemaining)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (audioRef.current && playingStoryId) {
                    const cur = audioRef.current.currentTime
                    const dur = audioRef.current.duration || 0
                    const currentStory = stories.find((s) => s.id === playingStoryId)
                    saveStoryBookmark({
                      storyId: playingStoryId,
                      storyTitle: currentStory?.title,
                      audioPosition: cur,
                      audioDuration: dur,
                      voiceId: selectedVoice
                    })
                    alert(`Bookmark saved at ${formatBookmarkTime(cur)}! Pick up here anytime.`)
                  }
                }}
                className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                title="Bookmark position"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (audioRef.current) {
                    if (isPlaying) {
                      audioRef.current.pause()
                    } else {
                      audioRef.current.play()
                    }
                  }
                }}
                className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center hover:bg-slate-800 transition"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>
              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause()
                  setIsPlaying(false)
                  setPlayingStoryId(null)
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: READ STORY FULL TEXT */}
      <AnimatePresence>
        {readingStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[85vh] bg-[#fdfbf7] rounded-3xl p-6 md:p-8 shadow-2xl border border-stone-200 flex flex-col justify-between overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest bg-amber-100/60 px-2.5 py-1 rounded-full">
                    {readingStory.category}
                  </span>
                  <h3 className="text-2xl font-serif font-black text-slate-900 mt-2">
                    {readingStory.title}
                  </h3>
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    by {readingStory.author || 'Classic Author'}
                  </p>
                </div>
                <button
                  onClick={() => setReadingStory(null)}
                  className="p-2 rounded-full hover:bg-stone-200/60 text-slate-400 hover:text-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto my-6 pr-2 space-y-4 text-slate-700 leading-relaxed font-serif text-base">
                {readingStory.content.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <button
                  onClick={() => handlePlayToggle(readingStory)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Listen with Voice Narration</span>
                </button>
                <button
                  onClick={() => setReadingStory(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Close Story
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE CUSTOM AI STORY ("Add Books") */}
      <AnimatePresence>
        {isGenerateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-black text-lg text-slate-900">Add New Book</h3>
                </div>
                <button onClick={() => setIsGenerateOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Describe a magical theme or character. Our OpenAI engine will craft a custom bedtime story and place it on your shelf.
              </p>

              <form onSubmit={handleGenerateStory} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Story Theme or Prompt</label>
                  <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="e.g. A tiny hedgehog searching for the constellation of stars..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGenerateOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generatingCustom}
                    className="px-5 py-2.5 rounded-full bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-2"
                  >
                    {generatingCustom ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    <span>Create Tale</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: STORY TIME PRO UPGRADE */}
      <AnimatePresence>
        {isUpgradeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Crown className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase text-purple-700">UNLIMITED ACCESS</span>
                </div>
                <button onClick={() => setIsUpgradeOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="font-serif text-2xl font-black text-slate-900 mb-2">
                Never Stop The Magic
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Unlock unlimited listening across all 20 classic children’s tales and custom AI storybooks with crystal-clear ElevenLabs voices.
              </p>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div
                  onClick={() => handleSubscribe('monthly')}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-slate-800 transition cursor-pointer hover:bg-slate-50"
                >
                  <div className="text-xs font-semibold text-slate-500 uppercase">Monthly Plan</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">$30.00 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                  <p className="text-[11px] text-slate-500 mt-2">Unlimited stories & all 5 narrator voices.</p>
                  <button className="w-full mt-4 py-2 rounded-xl bg-slate-100 text-slate-900 font-bold text-xs hover:bg-slate-200">
                    Select Monthly
                  </button>
                </div>

                <div
                  onClick={() => handleSubscribe('yearly')}
                  className="p-4 rounded-2xl border-2 border-amber-400 bg-amber-50/30 hover:bg-amber-50/60 transition cursor-pointer relative"
                >
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[9px] uppercase tracking-wide">
                    Save $40
                  </span>
                  <div className="text-xs font-semibold text-amber-800 uppercase">Yearly Plan</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">$320.00 <span className="text-xs font-normal text-slate-500">/ yr</span></div>
                  <p className="text-[11px] text-slate-500 mt-2">Best value for nightly family listening.</p>
                  <button className="w-full mt-4 py-2 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800">
                    Select Yearly
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Secure payments powered by RevenueCat & upcoming Stripe</span>
                <Link href="/privacy" className="text-slate-700 underline font-medium">Disclosures</Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: AUTHENTICATION (AWS SES OTP & 30-Day Tokens) */}
      <AnimatePresence>
        {isAuthOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  {authMode === 'otp' ? 'AWS SES VERIFICATION' : 'ACCOUNT ACCESS'}
                </span>
                <button onClick={() => setIsAuthOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="font-serif text-2xl font-black text-slate-900 mb-1">
                {authMode === 'signup' ? 'Create Account' : authMode === 'otp' ? 'Enter Email OTP' : 'Welcome Back'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {authMode === 'otp'
                  ? `Enter the 6-digit verification code sent to ${authEmail}.`
                  : '30-day session keeps your family listening effortlessly.'}
              </p>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
                  {authError}
                </div>
              )}
              {authMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
                  {authMessage}
                </div>
              )}

              {/* Mode: OTP verification */}
              {authMode === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={authOtpCode}
                      onChange={(e) => setAuthOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center tracking-widest text-lg font-mono font-bold focus:outline-none focus:border-slate-800"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center justify-center gap-2"
                  >
                    {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Login</span>}
                  </button>
                </form>
              )}

              {/* Mode: Signup */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUpRequest} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Parent Email</label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="parent@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none ${isPasswordMismatch ? 'border-red-400' : doPasswordsMatch ? 'border-emerald-500' : 'border-slate-200'}`}
                    />
                    {doPasswordsMatch && (
                      <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Passwords match
                      </p>
                    )}
                    {isPasswordMismatch && (
                      <p className="text-[11px] text-red-500 mt-1">
                        ✕ Passwords do not match yet
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || isPasswordMismatch}
                    className="w-full mt-2 py-3 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center justify-center gap-2"
                  >
                    {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Dispatch SES Code</span>}
                  </button>

                  <div className="text-center pt-2 text-xs text-slate-500">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setAuthMode('login')} className="font-bold text-slate-900 underline">
                      Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* Mode: Login */}
              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Parent Email</label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="parent@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-2 py-3 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center justify-center gap-2"
                  >
                    {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
                  </button>

                  <div className="text-center pt-2 text-xs text-slate-500">
                    Need an account?{' '}
                    <button type="button" onClick={() => setAuthMode('signup')} className="font-bold text-slate-900 underline">
                      Sign Up
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= SIDEBAR HAMBURGER DRAWER ================= */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: -340 }}
              animate={{ x: 0 }}
              exit={{ x: -340 }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className={`relative z-10 w-80 max-w-[85vw] h-full ${isNightMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} border-r p-6 shadow-2xl flex flex-col justify-between overflow-y-auto`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg">
                      <BookOpen className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm tracking-tight">StoryTime</div>
                      <div className="text-[11px] text-slate-400">Bedtime Classics & Audio</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Night Mode Switch */}
                <div className={`mt-5 p-3.5 rounded-2xl border ${isNightMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/60'} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    {isNightMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    <div>
                      <div className="text-xs font-bold">Night Mode</div>
                      <div className="text-[10px] text-slate-400">Soothing dark bedtime palette</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsNightMode(!isNightMode)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${isNightMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isNightMode ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Pro Membership Banner */}
                <button
                  onClick={() => { setIsSidebarOpen(false); setIsUpgradeOpen(true) }}
                  className="w-full mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-left shadow-lg shadow-amber-500/15 cursor-pointer hover:opacity-95 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Crown className="w-4 h-4" />
                      <span>{isSubscribed ? 'PRO Active' : 'Upgrade to PRO'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-75" />
                  </div>
                  <div className="text-[11px] opacity-90 mt-1">
                    {isSubscribed ? 'Unlimited listening unlocked' : 'Full unabridged stories • $30/mo'}
                  </div>
                </button>

                {/* Menu Nav Links */}
                <div className="mt-6 space-y-1">
                  {/* My Bookmarks */}
                  <button
                    onClick={() => { setIsSidebarOpen(false); setIsBookmarksOpen(true) }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs font-semibold text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Bookmark className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <div>
                        <div>My Bookmarks</div>
                        {Object.values(bookmarks).filter((b) => b && b.audioPosition > 3).length > 0 && (
                          <div className="text-[10px] text-rose-500 font-normal">
                            {Object.values(bookmarks).filter((b) => b && b.audioPosition > 3).length} stories in progress
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {Object.values(bookmarks).filter((b) => b && b.audioPosition > 3).length > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {Object.values(bookmarks).filter((b) => b && b.audioPosition > 3).length}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>

                  <button
                    onClick={() => { setIsSidebarOpen(false); setIsFaqsOpen(true) }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs font-semibold text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-blue-500" />
                      <span>FAQs</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => { setIsSidebarOpen(false); setIsSupportOpen(true) }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs font-semibold text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      <span>Support & Help</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <Link
                    href="/privacy"
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs font-semibold text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      <span>Privacy Policy</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/privacy"
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs font-semibold text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Terms & Disclosures</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>

              {/* Bottom Account & Version */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-medium text-slate-500 truncate mb-3">
                  Signed in as: <span className="font-bold text-slate-800 dark:text-slate-200">{user?.email || 'Guest Listener'}</span>
                </div>
                {user ? (
                  <button
                    onClick={() => { handleSignOut(); setIsSidebarOpen(false) }}
                    className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsSidebarOpen(false); setAuthMode('login'); setIsAuthOpen(true) }}
                    className="w-full py-2.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                  >
                    Sign In / Register
                  </button>
                )}
                <div className="text-[10px] text-slate-400 text-center mt-4">
                  StoryTime • v1.2.0 • COPPA Safe
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= FAQS MODAL ================= */}
      <AnimatePresence>
        {isFaqsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFaqsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative z-10 w-full max-w-lg ${isNightMode ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'} border rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="font-black text-lg">Frequently Asked Questions</div>
                <button
                  onClick={() => setIsFaqsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: "How does the 10-Minute Free Trial work?",
                    a: "Every guest user is allotted 10 minutes (600 seconds) of free AI-narrated storytelling. The timer runs only while audio is playing. Once expired, you can unlock unlimited listening with Pro."
                  },
                  {
                    q: "Are the stories and narrations stored permanently?",
                    a: "Yes! Every audio narration is saved permanently in cloud storage once generated. You will never wait twice or re-generate previous chapters."
                  },
                  {
                    q: "Can I choose different narrator voices?",
                    a: "Yes, you can choose from our curated voices: George (Warm Storyteller), Sarah (Gentle & Soothing), Lily (Calm & Soft), Charlie (Adventure), and Laura (Playful)."
                  },
                  {
                    q: "How do I cancel or manage my subscription?",
                    a: "Subscriptions can be managed or canceled anytime via your account settings with zero cancellation fees."
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${isNightMode ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800' : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>{item.q}</span>
                      <span className="text-slate-400">{expandedFaqIndex === idx ? '▲' : '▼'}</span>
                    </div>
                    {expandedFaqIndex === idx && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50 leading-relaxed">
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= SUPPORT MODAL ================= */}
      <AnimatePresence>
        {isSupportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSupportOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative z-10 w-full max-w-md ${isNightMode ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'} border rounded-3xl p-6 shadow-2xl text-center`}
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setIsSupportOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-7 h-7 text-emerald-500" />
              </div>

              <div className="font-black text-lg mb-2">Customer Support</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Have questions about stories, billing, or audio narration? Our family support team is available 7 days a week.
              </p>

              <Link
                href="/support"
                onClick={() => setIsSupportOpen(false)}
                className="block w-full py-3.5 rounded-2xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition mb-2 shadow-sm shadow-amber-500/20"
              >
                Submit a Support Query
              </Link>

              <a
                href="mailto:info@alpha-devs.cloud?subject=StoryTime Support Inquiry"
                className="block w-full py-3.5 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition mb-3"
              >
                Email: info@alpha-devs.cloud
              </a>

              <div className="text-[11px] text-slate-400">
                Average response time: &lt; 12 hours
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MY BOOKMARKS MODAL ================= */}
      <AnimatePresence>
        {isBookmarksOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookmarksOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative z-10 w-full max-w-lg ${isNightMode ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'} border rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <div className="font-black text-lg">My Bookmarks</div>
                </div>
                <button
                  onClick={() => setIsBookmarksOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {Object.values(bookmarks).filter((b) => b && b.audioPosition > 3).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-sm mb-1">No Active Bookmarks</div>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    When you listen to or read stories, your progress is automatically bookmarked here so you can pick up right where you left off.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.values(bookmarks)
                    .filter((b) => b && b.audioPosition > 3)
                    .map((bm) => {
                      const book = stories.find((s) => s.id === bm.storyId || s.title === bm.storyTitle)
                      const coverStyle = (book && STORY_COVERS[book.title]) || DEFAULT_COVER
                      const percent = bm.audioDuration > 0 ? Math.min(100, Math.round((bm.audioPosition / bm.audioDuration) * 100)) : 0

                      return (
                        <div
                          key={bm.storyId || bm.storyTitle}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${isNightMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200/70'}`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <img
                              src={coverStyle.imageUrl}
                              alt={bm.storyTitle || 'Story'}
                              className="w-12 h-16 rounded object-cover shadow shrink-0"
                            />
                            <div className="overflow-hidden">
                              <div className="font-bold text-xs truncate">
                                {bm.storyTitle || book?.title || 'Story'}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Left off at {formatBookmarkTime(bm.audioPosition)} {bm.audioDuration > 0 ? `• ${percent}%` : ''}
                              </div>
                              <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setIsBookmarksOpen(false)
                                if (book) {
                                  handlePlayToggle(book)
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition flex items-center gap-1.5 shadow cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Resume</span>
                            </button>
                            <button
                              onClick={() => {
                                deleteStoryBookmark(bm.storyId, bm.storyTitle)
                              }}
                              className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                              title="Delete bookmark"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER with Privacy Policy Link */}
      <footer className="mt-20 border-t border-slate-100 py-10 bg-slate-50 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-slate-800 text-sm">Bedtime Stories</span>
            <span>• Editorial Classic Library & AI Storyteller</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 underline font-medium">
              Privacy Policy & Disclosures
            </Link>
            <Link href="/support" className="hover:text-slate-900 underline font-medium">
              Support Page
            </Link>
            <a href="mailto:info@alpha-devs.cloud" className="hover:text-slate-900">
              info@alpha-devs.cloud
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
