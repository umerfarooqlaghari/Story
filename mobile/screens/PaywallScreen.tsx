import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import { useSubscription } from '../hooks/useSubscription';
import {
  getOfferings,
  findPackage,
  purchasePackage,
  restorePurchases,
  ENTITLEMENT_ID,
  ENTITLEMENT_ID_ALT
} from '../lib/subscriptionService';
import { API_BASE_URL } from '../lib/config';

// Crisp, high-fidelity Vector SVGs replacing all emojis
const CrownIcon = ({ size = 14, color = '#7c3aed' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </Svg>
);

const TimerIcon = ({ size = 22, color = '#15803d' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="13" r="8" />
    <Path d="M12 9v4l2.5 1.5M10 2h4M12 2v3" />
  </Svg>
);

const SparklesIcon = ({ size = 18, color = '#d97706' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
  </Svg>
);

const MicIcon = ({ size = 18, color = '#4f46e5' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
  </Svg>
);

const WandIcon = ({ size = 18, color = '#db2777' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m15 4-2 2M15 4l2 2M15 4l-9 9a2 2 0 0 0 0 2.8l1.4 1.4a2 2 0 0 0 2.8 0l9-9M6 19l-3 3M19 6l2-2M2 9l2-1M6 2l-1 2" />
  </Svg>
);

const BookIcon = ({ size = 18, color = '#15803d' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <Path d="M6 6h10M6 10h10M6 14h6" />
  </Svg>
);

const CloseIcon = ({ size = 16, color = '#64748b' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

const CheckIcon = ({ size = 14, color = '#ffffff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m5 13 4 4L19 7" />
  </Svg>
);

const StarIcon = ({ size = 10, color = '#ffffff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <Path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

export default function PaywallScreen({ navigation }: any) {
  const {
    isPremium,
    setIsPremium,
    trialSecondsRemaining,
    subscriptionPlan,
    setSubscriptionPlan,
    user
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoadingOfferings(true);
    setOfferingsError(null);
    try {
      const result = await getOfferings();
      if (result.status === 'ok') {
        setOfferings(result.offering);
      } else {
        setOfferingsError(result.message);
      }
    } catch (e: any) {
      setOfferingsError(e?.message || 'Unable to connect to Apple App Store.');
    } finally {
      setLoadingOfferings(false);
    }
  };

  const monthlyPkg = findPackage(offerings, 'monthly');
  const yearlyPkg = findPackage(offerings, 'yearly');

  const yearlyPriceString = yearlyPkg?.product.priceString || '$320';
  const monthlyPriceString = monthlyPkg?.product.priceString || '$30';

  const formatTrialTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubscribe = async () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or create a parent account before subscribing, so your subscription is safely attached to your account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In / Register', onPress: () => navigation.navigate('Auth') }
        ]
      );
      return;
    }

    const pkgToBuy = selectedPlan === 'yearly' ? yearlyPkg : monthlyPkg;
    if (!pkgToBuy) {
      Alert.alert(
        'Product Loading',
        'Subscription packages are currently loading from Apple App Store. Please wait a moment or tap Retry.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: loadOfferings }
        ]
      );
      return;
    }

    setPurchasing(true);
    try {
      if (user.id) {
        await Purchases.logIn(user.id);
      }

      console.log('[PaywallScreen] Prompting Apple In-App Purchase for package:', pkgToBuy.identifier);
      const res = await purchasePackage(pkgToBuy);

      if (res.success) {
        setIsPremium(true);
        setSubscriptionPlan(selectedPlan);

        // Sync with backend database in Supabase
        fetch(`${API_BASE_URL}/api/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, plan: selectedPlan })
        }).catch(() => {});

        Alert.alert(
          'Welcome to Story Time PRO!',
          `Your ${selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} subscription is now active with unlimited ElevenLabs narration!`,
          [{ text: 'Start Listening', onPress: () => navigation.goBack() }]
        );
      } else if (res.userCancelled) {
        // User closed Apple StoreKit sheet
      } else {
        Alert.alert(
          'Subscription Notice',
          'Purchase was completed, but active entitlement was not found. Please tap "Restore Purchases" to refresh.'
        );
      }
    } catch (e: any) {
      if (e.userCancelled) {
        // Dismissed Apple StoreKit dialog
      } else {
        console.error('[PaywallScreen] Purchase error:', e);
        Alert.alert('Purchase Failed', e.message || 'Could not complete Apple In-App Purchase.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      if (user?.id) {
        await Purchases.logIn(user.id);
      }

      const res = await restorePurchases();
      if (res.success) {
        setIsPremium(true);
        const active = res.customerInfo?.entitlements?.active;
        const ent = active ? (active[ENTITLEMENT_ID] || active[ENTITLEMENT_ID_ALT] || active['Premium']) as any : null;
        const plan = ent?.productIdentifier?.toLowerCase().includes('year') ? 'yearly' : 'monthly';
        setSubscriptionPlan(plan);

        if (user?.id) {
          fetch(`${API_BASE_URL}/api/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, plan })
          }).catch(() => {});
        }

        Alert.alert(
          'Purchases Restored',
          'Your Story Time PRO subscription was successfully restored!',
          [{ text: 'Start Listening', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('No Subscription Found', 'We could not find an active Story Time PRO subscription linked to your Apple ID.');
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e.message || 'Unable to restore purchases from Apple at this time.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Close Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <CloseIcon size={16} color="#64748b" />
        </TouchableOpacity>

        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <CrownIcon size={13} color="#7c3aed" />
            <Text style={styles.badgeText}>UNLIMITED ACCESS</Text>
          </View>
          <Text style={styles.title}>Never Stop The Magic</Text>
          <Text style={styles.subtitle}>
            Experience all 20 classic children's tales and unlimited custom AI bedtime stories with crystal-clear ElevenLabs voices.
          </Text>
        </View>

        {/* StoreKit Notice Banner if offerings failed to load */}
        {offeringsError && (
          <View style={[styles.trialBanner, { backgroundColor: '#fef2f2', borderColor: '#fecaca', marginBottom: 14 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trialTitle, { color: '#b91c1c' }]}>
                Subscription Packages Notice
              </Text>
              <Text style={[styles.trialDesc, { color: '#7f1d1d' }]}>
                {offeringsError}
              </Text>
            </View>
            <TouchableOpacity
              onPress={loadOfferings}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: '#b91c1c',
                borderRadius: 8,
                alignSelf: 'center',
                marginLeft: 8
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Card: Pro Active vs Free Trial vs Guest */}
        {user && isPremium ? (
          <View style={[styles.trialBanner, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
            <View style={[styles.trialIconContainer, { backgroundColor: '#ede9fe' }]}>
              <CrownIcon size={22} color="#7c3aed" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trialTitle, { color: '#7c3aed' }]}>
                StoryTime PRO Active
              </Text>
              <Text style={styles.trialDesc}>
                Your {subscriptionPlan === 'yearly' ? 'Yearly' : 'Monthly'} plan is active! Unlimited ElevenLabs audio and custom bedtime stories are unlocked.
              </Text>
            </View>
          </View>
        ) : user ? (
          <View style={[styles.trialBanner, trialSecondsRemaining <= 0 && styles.trialExpiredBanner]}>
            <View style={styles.trialIconContainer}>
              <TimerIcon size={22} color={trialSecondsRemaining > 0 ? "#15803d" : "#b91c1c"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trialTitle, trialSecondsRemaining <= 0 && { color: '#b91c1c' }]}>
                {trialSecondsRemaining > 0 ? '10-Minute Free Trial' : 'Free Trial Ended'}
              </Text>
              <Text style={styles.trialDesc}>
                {trialSecondsRemaining > 0
                  ? `${formatTrialTime(trialSecondsRemaining)} remaining of your generic books free trial.`
                  : 'You have used your 10 minutes of free storytelling. Upgrade to continue listening!'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.trialBanner, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
            <View style={[styles.trialIconContainer, { backgroundColor: '#f1f5f9' }]}>
              <CrownIcon size={20} color="#64748b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trialTitle, { color: '#0f172a' }]}>
                Sign In to Subscribe
              </Text>
              <Text style={styles.trialDesc}>
                Please sign in to unlock audio narration and link subscriptions to your parent account.
              </Text>
            </View>
          </View>
        )}

        {/* Feature List with Classy SVG Icon Badges */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={[styles.iconBadge, { backgroundColor: '#fef3c7' }]}>
              <SparklesIcon size={18} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Unlimited Story Audio</Text>
              <Text style={styles.featureSub}>Listen to all 20 classic tales with zero time limits</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.iconBadge, { backgroundColor: '#e0e7ff' }]}>
              <MicIcon size={18} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>ElevenLabs AI Narrator Voices</Text>
              <Text style={styles.featureSub}>George, Sarah, Rachel & Charlie bedtime voice actors</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.iconBadge, { backgroundColor: '#fce7f3' }]}>
              <WandIcon size={18} color="#db2777" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Unlimited Custom Story Maker</Text>
              <Text style={styles.featureSub}>Create brand new personalized fairy tales on demand</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.iconBadge, { backgroundColor: '#dcfce7' }]}>
              <BookIcon size={18} color="#15803d" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Foodpanda-Style Bookshelf Library</Text>
              <Text style={styles.featureSub}>Offline access, audio bookmarks & full whole stories</Text>
            </View>
          </View>
        </View>

        {/* Subscription Plan Cards */}
        <View style={styles.plansContainer}>
          {/* Yearly Card (Recommended) */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setSelectedPlan('yearly')}
            style={[styles.planCard, selectedPlan === 'yearly' && styles.selectedPlanCard]}
          >
            <View style={styles.bestValueBadge}>
              <StarIcon size={10} color="#ffffff" />
              <Text style={styles.bestValueText}>BEST VALUE • SAVE $40</Text>
            </View>

            <View style={styles.planHeaderRow}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.radioCircle, selectedPlan === 'yearly' && styles.radioCircleSelected]}>
                  {selectedPlan === 'yearly' && <CheckIcon size={11} color="#ffffff" />}
                </View>
                <View>
                  <Text style={styles.planName}>Yearly Plan</Text>
                  <Text style={styles.planBillingNote}>$26.67 / month, billed annually</Text>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.planPrice}>{yearlyPriceString}</Text>
                <Text style={styles.planPeriod}>/ year</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Monthly Card */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setSelectedPlan('monthly')}
            style={[styles.planCard, selectedPlan === 'monthly' && styles.selectedPlanCard]}
          >
            <View style={styles.planHeaderRow}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.radioCircle, selectedPlan === 'monthly' && styles.radioCircleSelected]}>
                  {selectedPlan === 'monthly' && <CheckIcon size={11} color="#ffffff" />}
                </View>
                <View>
                  <Text style={styles.planName}>Monthly Plan</Text>
                  <Text style={styles.planBillingNote}>Flexible, cancel anytime</Text>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.planPrice}>{monthlyPriceString}</Text>
                <Text style={styles.planPeriod}>/ month</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Subscribe Action Button */}
        <View style={styles.actionContainer}>
          {purchasing ? (
            <ActivityIndicator size="large" color="#000000" style={{ paddingVertical: 14 }} />
          ) : (
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.subscribeButton}
              onPress={handleSubscribe}
            >
              <Text style={styles.subscribeButtonText}>
                {!user
                  ? 'Sign In to Subscribe'
                  : isPremium
                  ? `Plan Active (${subscriptionPlan === 'yearly' ? 'Yearly' : 'Monthly'}) • Switch Plan`
                  : `Subscribe for ${selectedPlan === 'yearly' ? `${yearlyPriceString} / yr` : `${monthlyPriceString} / mo`}`}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleRestore}
            disabled={restoring || purchasing}
            style={{ paddingVertical: 8, alignItems: 'center' }}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.legalNotice}>
            Subscription renews automatically unless cancelled at least 24 hours prior to end of period. Payment will be charged to your Apple ID / RevenueCat account.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 40
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f3ff',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ede9fe'
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#7c3aed'
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'Georgia',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 13.5,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 12
  },
  trialExpiredBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca'
  },
  trialIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  trialTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d'
  },
  trialDesc: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2
  },
  featuresList: {
    marginBottom: 24,
    gap: 14,
    backgroundColor: '#f8fafc',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b'
  },
  featureSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1
  },
  plansContainer: {
    gap: 12,
    marginBottom: 22
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16,
    position: 'relative'
  },
  selectedPlanCard: {
    borderColor: '#000000',
    backgroundColor: '#fcfcfc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#000000',
    paddingVertical: 3.5,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  bestValueText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  radioCircleSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000'
  },
  planName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#111827'
  },
  planBillingNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  },
  priceContainer: {
    alignItems: 'flex-end'
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827'
  },
  planPeriod: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280'
  },
  actionContainer: {
    alignItems: 'center'
  },
  subscribeButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 14
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 16
  },
  legalNotice: {
    fontSize: 10.5,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 12
  }
});
