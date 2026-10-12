import { useState, useEffect, useCallback } from 'react';
import Purchases, { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { getUserSession, addAuthListener, UserProfile } from '../lib/auth';
import { API_BASE_URL } from '../lib/config';
import { setupRevenueCat, isExpoGo } from '../lib/clients';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [trialSecondsRemaining, setTrialSecondsRemaining] = useState(600); // 10 minutes free trial = 600s
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [packages, setPackages] = useState<{ monthly?: PurchasesPackage; yearly?: PurchasesPackage }>({});

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
      console.log('Error fetching subscription status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOfferings = useCallback(async () => {
    try {
      setupRevenueCat();
      const currentOfferings = await Purchases.getOfferings();
      if (currentOfferings && currentOfferings.current) {
        setOfferings(currentOfferings);
        const current = currentOfferings.current;
        const monthlyPkg = current.monthly || current.availablePackages.find(p => p.identifier === '$rc_monthly' || p.product.identifier.includes('monthly'));
        const yearlyPkg = current.annual || current.availablePackages.find(p => p.identifier === '$rc_annual' || p.product.identifier.includes('yearly'));
        setPackages({ monthly: monthlyPkg, yearly: yearlyPkg });
      }
    } catch (err) {
      console.log('[RevenueCat] Load offerings notice:', err);
    }
  }, []);

  useEffect(() => {
    const checkRevenueCat = async (activeUser: UserProfile) => {
      try {
        setupRevenueCat();
        if (activeUser?.id) {
          await Purchases.logIn(activeUser.id);
        }
        const customerInfo = await Purchases.getCustomerInfo();
        const hasEntitlement =
          typeof customerInfo.entitlements.active['story_teller_pro'] !== 'undefined' ||
          typeof customerInfo.entitlements.active['Premium'] !== 'undefined';
        if (hasEntitlement) {
          setIsPremium(true);
          const ent = customerInfo.entitlements.active['story_teller_pro'] || customerInfo.entitlements.active['Premium'];
          const plan = ent?.productIdentifier?.toLowerCase().includes('year') ? 'yearly' : 'monthly';
          setSubscriptionPlan(plan);
        }
      } catch (e) {
        // Purchases non-native fallback
      }
    };

    loadOfferings();

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
  }, [fetchStatus, loadOfferings]);

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

  const subscribe = async (plan: 'monthly' | 'yearly'): Promise<{ success: boolean; error?: string; cancelled?: boolean }> => {
    if (!user || !user.id) {
      return { success: false, error: 'Please sign in to your account before subscribing.' };
    }
    const userId = user.id;

    try {
      setupRevenueCat();
      try {
        await Purchases.logIn(userId);
      } catch (loginErr) {
        console.warn('[RevenueCat] logIn notice:', loginErr);
      }

      // Check for available package
      let targetPackage = plan === 'yearly' ? packages.yearly : packages.monthly;
      if (!targetPackage) {
        try {
          const freshOfferings = await Purchases.getOfferings();
          if (freshOfferings?.current) {
            setOfferings(freshOfferings);
            const current = freshOfferings.current;
            const mPkg = current.monthly || current.availablePackages.find(p => p.identifier === '$rc_monthly' || p.product.identifier.includes('monthly'));
            const yPkg = current.annual || current.availablePackages.find(p => p.identifier === '$rc_annual' || p.product.identifier.includes('yearly'));
            setPackages({ monthly: mPkg, yearly: yPkg });
            targetPackage = plan === 'yearly' ? yPkg : mPkg;
          }
        } catch (offeringsErr) {
          console.warn('[RevenueCat] Could not refresh offerings:', offeringsErr);
        }
      }

      // If running on native iOS/Android (TestFlight / App Store) and package exists
      if (targetPackage && !isExpoGo) {
        console.log('[RevenueCat] Prompting native StoreKit purchase for:', targetPackage.identifier);
        const purchaseResult = await Purchases.purchasePackage(targetPackage);
        const hasEntitlement =
          typeof purchaseResult.customerInfo.entitlements.active['story_teller_pro'] !== 'undefined' ||
          typeof purchaseResult.customerInfo.entitlements.active['Premium'] !== 'undefined';

        if (hasEntitlement) {
          setIsPremium(true);
          setSubscriptionPlan(plan);
          setTrialSecondsRemaining(600);

          // Sync with backend database
          fetch(`${API_BASE_URL}/api/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, plan })
          }).catch(() => {});

          return { success: true };
        } else {
          return {
            success: false,
            error: 'Purchase completed, but entitlement was not found. Please tap "Restore Purchases" or contact support.'
          };
        }
      }

      // Fallback for Expo Go client or when native StoreKit is unavailable
      console.log('[RevenueCat] Using backend subscription fallback (Expo Go / Test Store)');
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
      return { success: false, error: data.message || 'Subscription failed.' };
    } catch (e: any) {
      if (e?.userCancelled) {
        return { success: false, cancelled: true };
      }
      return { success: false, error: e?.message || 'Payment processing failed.' };
    }
  };

  const restorePurchases = async (): Promise<{ success: boolean; isPremium: boolean; error?: string }> => {
    try {
      setupRevenueCat();
      if (user?.id) {
        await Purchases.logIn(user.id);
      }
      const customerInfo = await Purchases.restorePurchases();
      const hasEntitlement =
        typeof customerInfo.entitlements.active['story_teller_pro'] !== 'undefined' ||
        typeof customerInfo.entitlements.active['Premium'] !== 'undefined';

      if (hasEntitlement) {
        setIsPremium(true);
        const ent = customerInfo.entitlements.active['story_teller_pro'] || customerInfo.entitlements.active['Premium'];
        const plan = ent?.productIdentifier?.toLowerCase().includes('year') ? 'yearly' : 'monthly';
        setSubscriptionPlan(plan);
        setTrialSecondsRemaining(600);

        if (user?.id) {
          fetch(`${API_BASE_URL}/api/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, plan })
          }).catch(() => {});
        }

        return { success: true, isPremium: true };
      } else {
        return { success: true, isPremium: false };
      }
    } catch (e: any) {
      console.error('[RevenueCat] Restore error:', e);
      return { success: false, isPremium: false, error: e?.message || 'Could not restore purchases.' };
    }
  };

  const refreshStatus = () => {
    fetchStatus(user);
    loadOfferings();
  };

  return {
    isPremium,
    trialSecondsRemaining,
    isTrialExpired: trialSecondsRemaining <= 0 && !isPremium,
    subscriptionPlan,
    user,
    loading,
    offerings,
    packages,
    recordListeningSeconds,
    subscribe,
    restorePurchases,
    refreshStatus
  };
}
