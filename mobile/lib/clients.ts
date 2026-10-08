import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// Supabase
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// RevenueCat Hook
export const setupRevenueCat = () => {
  if (Platform.OS === 'ios') {
    Purchases.configure({ apiKey: "YOUR_RC_IOS_KEY" });
  } else if (Platform.OS === 'android') {
    Purchases.configure({ apiKey: "YOUR_RC_ANDROID_KEY" });
  }
};
