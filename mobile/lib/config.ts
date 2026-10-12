// Centralized environment configuration for Mobile

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://story-efhu.onrender.com'
).replace(/\/$/, '');

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

// RevenueCat Public API Keys
export const REVENUECAT_IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_JXVeSAirIvirNNpsdUxDWVORoMN';

export const REVENUECAT_ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || 'goog_mOWhSEdmeXPMfLYruMehlTKrpaG';

export const REVENUECAT_TEST_STORE_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY || 'test_CbDkieSGZtctvuTehYUudJJXJQm';

