-- Create a table for user profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a table for subscriptions
CREATE TABLE public.subscriptions (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  status TEXT,
  premium_tier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a table for stories
CREATE TABLE public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own stories" ON public.stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Add classic fields to stories
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_classic BOOLEAN DEFAULT FALSE;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS ambient_track_id TEXT DEFAULT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS has_sfx BOOLEAN DEFAULT FALSE;
-- Allow anonymous read of classic stories (since user_id might be null or a system ID for classics)
CREATE POLICY "Anyone can view classic stories" ON public.stories FOR SELECT USING (is_classic = TRUE);

-- Create a table for cached audio variants (different voices for the same story)
CREATE TABLE IF NOT EXISTS public.story_audio_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  ambient_track_id TEXT DEFAULT NULL,
  has_sfx BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, voice_id)
);
ALTER TABLE public.story_audio_variants ADD COLUMN IF NOT EXISTS ambient_track_id TEXT DEFAULT NULL;
ALTER TABLE public.story_audio_variants ADD COLUMN IF NOT EXISTS has_sfx BOOLEAN DEFAULT FALSE;

ALTER TABLE public.story_audio_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view audio variants" ON public.story_audio_variants FOR SELECT USING (true);
CREATE POLICY "System can insert variants" ON public.story_audio_variants FOR INSERT WITH CHECK (true);

-- Create table for customer support queries
CREATE TABLE IF NOT EXISTS public.support_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT DEFAULT 'General Inquiry',
  subject TEXT,
  message TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit support query" ON public.support_queries FOR INSERT WITH CHECK (true);


