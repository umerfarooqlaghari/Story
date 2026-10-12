import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  REVENUECAT_IOS_API_KEY,
  REVENUECAT_ANDROID_API_KEY
} from './config';

// Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// RevenueCat Hook
export const setupRevenueCat = () => {
  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
    if (apiKey) {
      Purchases.configure({ apiKey });
      console.log('[RevenueCat] Configured with active platform key.');
    }
  } catch (err) {
    console.warn('[RevenueCat] Initialization warning (fallback active):', err);
  }
};
