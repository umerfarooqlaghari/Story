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

import { initPurchases } from './subscriptionService';

// RevenueCat Hook
export const setupRevenueCat = () => {
  initPurchases().catch((err) => {
    console.warn('[RevenueCat] Initialization warning:', err);
  });
};
