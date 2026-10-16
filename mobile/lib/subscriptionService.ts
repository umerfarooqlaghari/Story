import Purchases, { LOG_LEVEL, PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { LogBox, Platform, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import {
  API_BASE_URL,
  REVENUECAT_IOS_API_KEY,
  REVENUECAT_ANDROID_API_KEY,
  REVENUECAT_TEST_STORE_API_KEY
} from './config';

// Prevent noisy LogBox popups while preserving console visibility
LogBox.ignoreLogs([
  'RevenueCat',
  '[RevenueCat]',
  'API Key is not recognized',
  'OfferingsManager.Error',
  'no products registered',
  'Purchases instance already set',
]);

export function resolveApiKey(): string {
  if (Platform.OS === 'android') {
    return REVENUECAT_ANDROID_API_KEY || REVENUECAT_TEST_STORE_API_KEY;
  }

  // Real devices (physical iPhone, TestFlight) ALWAYS use native iOS key
  // Only non-device simulator during dev uses Test Store
  const isSimulator = __DEV__ && !Constants.isDevice;
  if (isSimulator && REVENUECAT_TEST_STORE_API_KEY) {
    return REVENUECAT_TEST_STORE_API_KEY;
  }

  return REVENUECAT_IOS_API_KEY || REVENUECAT_TEST_STORE_API_KEY;
}

export const ENTITLEMENT_ID = 'story_teller_pro';
export const ENTITLEMENT_ID_ALT = 'Story Teller Pro';

export function hasPremiumEntitlement(info: CustomerInfo | null | undefined): boolean {
  if (!info || !info.entitlements || !info.entitlements.active) return false;
  const active = info.entitlements.active;
  return !!(
    active[ENTITLEMENT_ID] ||
    active[ENTITLEMENT_ID_ALT] ||
    active['Premium'] ||
    active['pro']
  );
}

let purchasesConfigured = false;
let initPromise: Promise<void> | null = null;

export const isPurchasesReady = (): boolean => purchasesConfigured;

async function installQuietLogHandler() {
  try {
    Purchases.setLogHandler((level, message) => {
      if (level === LOG_LEVEL.ERROR) {
        console.warn('[RevenueCat]', message);
        return;
      }
      if (__DEV__ && (level === LOG_LEVEL.WARN || level === LOG_LEVEL.INFO)) {
        console.log('[RevenueCat]', message);
      }
    });
    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);
  } catch {
    // Graceful fallback for environments where setLogHandler is not available
  }
}

export const initPurchases = async (): Promise<void> => {
  if (purchasesConfigured) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const apiKey = resolveApiKey();
      if (!apiKey) {
        console.warn('[RevenueCat] No public SDK key found for', Platform.OS);
        return;
      }

      await installQuietLogHandler();
      Purchases.configure({ apiKey });
      purchasesConfigured = true;
      console.log(
        '[RevenueCat] Configured for',
        Platform.OS,
        apiKey.startsWith('test_') ? '(Test Store)' : '(App Store / StoreKit)'
      );
    } catch (e: any) {
      purchasesConfigured = false;
      console.warn('[RevenueCat] Initialization warning:', e?.message || e);
    }
  })();

  try {
    await initPromise;
  } catch {
    // Avoid unhandled rejection on boot
  }
};

export type OfferingsResult =
  | { status: 'ok'; offering: PurchasesOffering }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string };

export const getOfferings = async (): Promise<OfferingsResult> => {
  await initPurchases();

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (current && current.availablePackages && current.availablePackages.length > 0) {
      return { status: 'ok', offering: current };
    }
    return {
      status: 'empty',
      message: 'No subscription packages returned from Apple App Store for this offering. Check that In-App Purchases are configured in App Store Connect.'
    };
  } catch (e: any) {
    const msg = e?.message || 'Failed to load subscription offerings from App Store.';
    console.warn('[RevenueCat] getOfferings error:', msg);
    return { status: 'error', message: msg };
  }
};

export const findPackage = (
  offering: PurchasesOffering | null,
  plan: 'monthly' | 'yearly'
): PurchasesPackage | null => {
  if (!offering || !offering.availablePackages) return null;

  // 1. Check standard RevenueCat package slots ($rc_monthly / $rc_annual)
  if (plan === 'monthly' && offering.monthly) return offering.monthly;
  if (plan === 'yearly' && offering.annual) return offering.annual;

  // 2. Fallbacks based on App Store product identifiers and package identifiers
  const monthlyIdentifiers = ['com.umerfarooqlaghari.story.monthly', 'pro_monthly_30', 'monthly', '$rc_monthly'];
  const yearlyIdentifiers = ['com.umerfarooqlaghari.story.yearly', 'pro_yearly_320', 'yearly', '$rc_annual'];
  const targetIds = plan === 'monthly' ? monthlyIdentifiers : yearlyIdentifiers;

  const found = offering.availablePackages.find((pkg) => {
    const pkgId = pkg.identifier || '';
    const prodId = pkg.product?.identifier || '';
    return (
      targetIds.includes(pkgId) ||
      targetIds.includes(prodId) ||
      (plan === 'monthly' && /month/i.test(pkgId)) ||
      (plan === 'yearly' && /year|annual/i.test(pkgId))
    );
  });

  return found || null;
};

export const purchasePackage = async (
  pack: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; userCancelled?: boolean }> => {
  await initPurchases();

  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    const premiumActive = hasPremiumEntitlement(customerInfo);
    return { success: premiumActive, customerInfo };
  } catch (e: any) {
    if (e.userCancelled) {
      return { success: false, userCancelled: true };
    }
    throw e;
  }
};

export const restorePurchases = async (): Promise<{ success: boolean; customerInfo?: CustomerInfo }> => {
  await initPurchases();

  try {
    const customerInfo = await Purchases.restorePurchases();
    const premiumActive = hasPremiumEntitlement(customerInfo);
    return { success: premiumActive, customerInfo };
  } catch (e: any) {
    console.warn('[RevenueCat] restorePurchases error:', e);
    throw e;
  }
};

/**
 * Opens Apple App Store or Google Play Store subscription management screen.
 * Complies with Apple Review Guideline 3.1.2 by allowing users to manage or cancel auto-renewal.
 */
export const openSubscriptionManagement = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      // 1. Try StoreKit native sheet via Purchases if supported
      if (typeof Purchases.showManageSubscriptions === 'function') {
        try {
          await Purchases.showManageSubscriptions();
          return;
        } catch (e) {
          console.log('[Subscription] Purchases.showManageSubscriptions fallback:', e);
        }
      }
      // 2. Direct Apple standard subscription URL (Apple Guideline compliant)
      const appleUrl = 'https://apps.apple.com/account/subscriptions';
      await Linking.openURL(appleUrl);
    } else {
      // Android Play Store subscriptions
      await Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  } catch (err) {
    console.warn('[Subscription] Could not open subscription management:', err);
    Alert.alert(
      'Manage Subscription',
      Platform.OS === 'ios'
        ? 'To cancel or manage your subscription, please open iPhone Settings > Apple ID > Subscriptions > Bedtime Kids Story Teller.'
        : 'To cancel or manage your subscription, please open Google Play Store > Profile > Payments & Subscriptions.'
    );
  }
};

/**
 * Cancels subscription records on our backend server and revokes promotional entitlements.
 */
export const cancelBackendSubscription = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/cancel-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      message: data.message || (res.ok ? 'Subscription cancelled successfully.' : 'Failed to cancel subscription.')
    };
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to cancel subscription on server.' };
  }
};
