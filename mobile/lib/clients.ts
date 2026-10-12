import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  REVENUECAT_IOS_API_KEY,
  REVENUECAT_ANDROID_API_KEY,
  REVENUECAT_TEST_STORE_API_KEY
} from './config';

// Safe Supabase client initialization (guarantees module load never throws)
const validUrl = (SUPABASE_URL && SUPABASE_URL.startsWith('http'))
  ? SUPABASE_URL
  : 'https://placeholder.supabase.co';
const validKey = SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(validUrl, validKey);

// Check if currently running inside Expo Go client app
export const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// RevenueCat Hook
let isConfiguredSync = false;
export const setupRevenueCat = () => {
  if (isConfiguredSync) return;
  try {
    // When running in Expo Go, native StoreKit is not available, so RevenueCat requires the Test Store key.
    // In standalone production / TestFlight builds, RevenueCat requires the native StoreKit API key.
    let apiKey: string;
    if (isExpoGo) {
      apiKey = REVENUECAT_TEST_STORE_API_KEY;
    } else {
      apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
    }

    if (apiKey) {
      Purchases.configure({ apiKey });
      isConfiguredSync = true;
      console.log(`[RevenueCat] Initialized successfully in ${isExpoGo ? 'Expo Go (Test Store)' : 'Native ' + Platform.OS} mode.`);
    }
  } catch (err) {
    console.warn('[RevenueCat] Initialization warning (fallback active):', err);
  }
};
