import { useState, useEffect, useCallback } from 'react';
import Purchases from 'react-native-purchases';
import { getUserSession, addAuthListener, UserProfile } from '../lib/auth';
import { API_BASE_URL } from '../lib/config';
import {
  initPurchases,
  hasPremiumEntitlement,
  ENTITLEMENT_ID,
  ENTITLEMENT_ID_ALT
} from '../lib/subscriptionService';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [trialSecondsRemaining, setTrialSecondsRemaining] = useState(600); // 10 minutes free trial = 600s
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async (activeUser: UserProfile | null) => {
    if (!activeUser || !activeUser.id) {
      // Unauthenticated guest: never premium
      setIsPremium(false);
      setSubscriptionPlan(null);
      setTrialSecondsRemaining(600);
      setLoading(false);
      return;
    }

    const userId = activeUser.id;
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
      console.log('[useSubscription] Error fetching backend subscription status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkRevenueCat = useCallback(async (activeUser: UserProfile) => {
    try {
      await initPurchases();
      if (activeUser?.id) {
        await Purchases.logIn(activeUser.id);
      }
      const customerInfo = await Purchases.getCustomerInfo();
      if (hasPremiumEntitlement(customerInfo)) {
        setIsPremium(true);
        const active = customerInfo.entitlements.active;
        const ent = (active[ENTITLEMENT_ID] || active[ENTITLEMENT_ID_ALT] || active['Premium']) as any;
        const plan = ent?.productIdentifier?.toLowerCase().includes('year') ? 'yearly' : 'monthly';
        setSubscriptionPlan(plan);
      }
    } catch (e) {
      // Offline or initialization warning
    }
  }, []);

  useEffect(() => {
    // 1. Initial user session load
    getUserSession().then((stored) => {
      setUser(stored);
      fetchStatus(stored);
      if (stored && stored.id) {
        checkRevenueCat(stored);
      }
    });

    // 2. Auth changes listener (login, signup, logout)
    const unsubscribeAuth = addAuthListener((updatedUser) => {
      setUser(updatedUser);
      fetchStatus(updatedUser);
      if (updatedUser && updatedUser.id) {
        checkRevenueCat(updatedUser);
      } else {
        // Logged out: reset all premium states and unlink RevenueCat
        setIsPremium(false);
        setSubscriptionPlan(null);
        Purchases.logOut().catch(() => {});
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [fetchStatus, checkRevenueCat]);

  const recordListeningSeconds = async (seconds: number) => {
    if (isPremium) return;

    setTrialSecondsRemaining((prev) => {
      const updated = Math.max(0, prev - seconds);
      const userId = user?.id || 'guest_device_user';
      fetch(`${API_BASE_URL}/api/update-trial-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, seconds_listened: seconds })
      }).catch(() => {});
      return updated;
    });
  };

  const refreshStatus = () => {
    fetchStatus(user);
    if (user && user.id) {
      checkRevenueCat(user);
    }
  };

  return {
    isPremium,
    setIsPremium,
    trialSecondsRemaining,
    isTrialExpired: trialSecondsRemaining <= 0 && !isPremium,
    subscriptionPlan,
    setSubscriptionPlan,
    user,
    loading,
    recordListeningSeconds,
    refreshStatus
  };
}
