import { useState, useEffect, useCallback } from 'react';
import Purchases from 'react-native-purchases';
import { getUserSession, addAuthListener, UserProfile } from '../lib/auth';
import { API_BASE_URL } from '../lib/config';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [trialSecondsRemaining, setTrialSecondsRemaining] = useState(600); // 10 minutes free trial = 600s
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async (activeUser: UserProfile | null) => {
    const userId = activeUser?.id || 'guest_device_user';
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscription-status?user_id=${userId}`);
      const data = await res.json();
      if (data.is_premium) {
        setIsPremium(true);
        setSubscriptionPlan(data.subscription_plan || 'monthly');
      } else {
        setIsPremium(false);
        setSubscriptionPlan(null);
      }
      if (typeof data.trial_seconds_remaining === 'number') {
        setTrialSecondsRemaining(data.trial_seconds_remaining);
      }
    } catch (e) {
      console.log('Error fetching subscription status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial user session load
    getUserSession().then((stored) => {
      setUser(stored);
      fetchStatus(stored);
    });

    // 2. Auth changes listener (login, signup, logout)
    const unsubscribeAuth = addAuthListener((updatedUser) => {
      setUser(updatedUser);
      fetchStatus(updatedUser);
    });

    // 3. RevenueCat SDK listener (if configured)
    const checkRevenueCat = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const hasEntitlement =
          typeof customerInfo.entitlements.active['story_teller_pro'] !== 'undefined' ||
          typeof customerInfo.entitlements.active['Premium'] !== 'undefined';
        if (hasEntitlement) {
          setIsPremium(true);
        }
      } catch (e) {
        // Purchases non-native fallback
      }
    };
    checkRevenueCat();

    return () => {
      unsubscribeAuth();
    };
  }, [fetchStatus]);

  const recordListeningSeconds = async (seconds: number) => {
    if (isPremium) return;

    setTrialSecondsRemaining((prev) => {
      const updated = Math.max(0, prev - seconds);
      // Sync with backend
      const userId = user?.id || 'guest_device_user';
      fetch(`${API_BASE_URL}/api/update-trial-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, seconds_listened: seconds })
      }).catch(() => {});
      return updated;
    });
  };

  const subscribe = async (plan: 'monthly' | 'yearly') => {
    const userId = user?.id || 'guest_device_user';
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, plan })
      });
      const data = await res.json();
      if (data.success) {
        setIsPremium(true);
        setSubscriptionPlan(plan);
        setTrialSecondsRemaining(600);
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message || e };
    }
    return { success: false };
  };

  const refreshStatus = () => {
    fetchStatus(user);
  };

  return {
    isPremium,
    trialSecondsRemaining,
    isTrialExpired: trialSecondsRemaining <= 0 && !isPremium,
    subscriptionPlan,
    user,
    loading,
    recordListeningSeconds,
    subscribe,
    refreshStatus
  };
}
