// Centralized environment configuration for Mobile

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://story-efhu.onrender.com'
).replace(/\/$/, '');

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qbdeadqwfyostiyfcdvl.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZGVhZHF3Znlvc3RpeWZjZHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODA0OTMsImV4cCI6MjEwNzA1NjQ5M30.Rk35HfJ6Vje-7ZdE8PK7rxPcnmm-w530yr5EkngitmU';

// RevenueCat Public API Keys
export const REVENUECAT_IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_JXVeSAirIvirNNpsdUxDWVORoMN';

export const REVENUECAT_ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || 'goog_mOWhSEdmeXPMfLYruMehlTKrpaG';
