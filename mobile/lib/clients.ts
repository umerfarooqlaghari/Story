import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
