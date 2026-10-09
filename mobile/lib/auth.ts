import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  email: string;
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
