import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// Supabase
const supabaseUrl = 'https://qbdeadqwfyostiyfcdvl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZGVhZHF3Znlvc3RpeWZjZHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODA0OTMsImV4cCI6MjEwNzA1NjQ5M30.Rk35HfJ6Vje-7ZdE8PK7rxPcnmm-w530yr5EkngitmU';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// RevenueCat Hook
export const setupRevenueCat = () => {
  // Normally RevenueCat has distinct iOS and Android keys. 
  // Using the test key provided in backend/.env for both for now.
  if (Platform.OS === 'ios') {
    Purchases.configure({ apiKey: "test_CbDkieSGZtctvuTehYUudJJXJQm" });
  } else if (Platform.OS === 'android') {
    Purchases.configure({ apiKey: "test_CbDkieSGZtctvuTehYUudJJXJQm" });
  }
};
