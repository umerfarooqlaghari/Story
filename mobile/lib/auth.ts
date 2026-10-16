import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { API_BASE_URL } from './config';
import { clearAllBookmarks } from './bookmarks';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  is_premium?: boolean;
  subscription_plan?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_days: number;
}

const USER_KEY = '@story_user';
const TOKENS_KEY = '@story_tokens';

type AuthListener = (user: UserProfile | null) => void;
const listeners: Set<AuthListener> = new Set();

export const addAuthListener = (listener: AuthListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = (user: UserProfile | null) => {
  listeners.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {
      console.log('Auth listener error:', e);
    }
  });
};

export const saveUserSession = async (user: UserProfile, tokens?: AuthTokens): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    if (tokens) {
      await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    }
    notifyListeners(user);
  } catch (e) {
    console.error('Error saving user session:', e);
  }
};

export const getUserSession = async (): Promise<UserProfile | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (raw) {
      return JSON.parse(raw) as UserProfile;
    }
  } catch (e) {
    console.error('Error reading user session:', e);
  }
  return null;
};

export const getTokens = async (): Promise<AuthTokens | null> => {
  try {
    const raw = await AsyncStorage.getItem(TOKENS_KEY);
    if (raw) {
      return JSON.parse(raw) as AuthTokens;
    }
  } catch (e) {
    console.error('Error reading tokens:', e);
  }
  return null;
};

export const clearUserSession = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([USER_KEY, TOKENS_KEY]);
    notifyListeners(null);
  } catch (e) {
    console.error('Error clearing user session:', e);
  }
};

/**
 * Permanently deletes the user account, associated cloud data, local bookmarks,
 * and clears session in compliance with Apple App Store Guideline 5.1.1(v).
 */
export const deleteUserAccount = async (
  userId: string,
  email?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const tokens = await getTokens();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (tokens?.access_token) {
      headers['Authorization'] = `Bearer ${tokens.access_token}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, email: email || '' }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Failed to delete account on server.');
    }

    // 1. Clear local bookmarks
    await clearAllBookmarks();

    // 2. Clear user session and tokens
    await clearUserSession();

    // 3. Log out of RevenueCat
    try {
      await Purchases.logOut();
    } catch {}

    return {
      success: true,
      message: data.message || 'Your account and personal data have been permanently deleted.',
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Failed to delete account. Please try again or contact support.',
    };
  }
};
