import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/clients';
import { saveUserSession, clearUserSession, getUserSession, UserProfile } from '../lib/auth';
import { API_BASE_URL } from '../lib/config';
import Svg, { Path, Circle } from 'react-native-svg';

const CrownIcon = ({ size = 32, color = '#d97706' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </Svg>
);

const CheckIcon = ({ size = 12, color = '#16a34a' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m5 13 4 4L19 7" />
  </Svg>
);

const CloseIcon = ({ size = 12, color = '#dc2626' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export default function AuthScreen({ navigation }: any) {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'otp' | 'forgot' | 'forgot_otp'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Live Password Validation Checks
  const hasPassword = password.length > 0;
  const isPasswordLengthValid = password.length >= 6;
  const hasConfirmPassword = confirmPassword.length > 0;
  const doPasswordsMatch = hasConfirmPassword && password === confirmPassword;
  const isPasswordMismatch = hasConfirmPassword && password !== confirmPassword;

  useEffect(() => {
    getUserSession().then((saved) => {
      if (saved) {
        setCurrentUser(saved);
      } else {
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            setCurrentUser({ id: data.user.id, email: data.user.email || '' });
          }
        });
      }
    });
  }, []);

  // Helper for safe JSON fetching
  const safeFetch = async (url: string, bodyObj: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj)
    });
    const rawText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(rawText || 'Server error occurred.');
    }
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Operation failed.');
    }
    return data;
  };

  // 1. Sign Up Request -> sends OTP via AWS SES
  const handleSignUpRequest = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Required Fields', 'Please complete all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Password and Confirm Password must match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password Weak', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await safeFetch(`${API_BASE_URL}/api/auth/signup-request`, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password: password.trim(),
        confirm_password: confirmPassword.trim()
      });

      Alert.alert(
        'Code Dispatched',
        `A 6-digit verification code has been sent via AWS SES to ${email.trim()}.`
      );
      setAuthMode('otp');
    } catch (e: any) {
      Alert.alert('Signup Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Signup OTP from AWS SES
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Required', 'Please enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      const data = await safeFetch(`${API_BASE_URL}/api/auth/signup-verify`, {
        email: email.trim(),
        otp_code: otpCode.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim()
      });

      // Persist session to AsyncStorage & notify app!
      await saveUserSession(data.user, data.tokens);
      setCurrentUser(data.user);

      Alert.alert(
        'Account Activated',
        `Welcome ${data.user.full_name || data.user.email}! You are now automatically logged in.`,
        [{ text: 'Start Listening', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Login with 30-Day Tokens
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await safeFetch(`${API_BASE_URL}/api/auth/login`, {
        email: email.trim(),
        password: password.trim()
      });

      // Persist session to AsyncStorage & notify app!
      await saveUserSession(data.user, data.tokens);
      setCurrentUser(data.user);

      Alert.alert('Welcome Back', `Signed in as ${data.user.email}.`, [
        { text: 'Go to Library', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      Alert.alert('Authentication Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Forgot Password Request
  const handleForgotPasswordRequest = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await safeFetch(`${API_BASE_URL}/api/auth/forgot-password-request`, {
        email: email.trim()
      });

      Alert.alert('Reset Code Sent', `A reset code has been sent via AWS SES to ${email.trim()}.`);
      setAuthMode('forgot_otp');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Reset Password Verify
  const handleResetPasswordVerify = async () => {
    if (!otpCode.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Required', 'Please complete all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await safeFetch(`${API_BASE_URL}/api/auth/forgot-password-verify`, {
        email: email.trim(),
        otp_code: otpCode.trim(),
        new_password: password.trim(),
        confirm_password: confirmPassword.trim()
      });

      Alert.alert('Success', 'Password has been reset! Please log in with your new password.');
      setAuthMode('login');
    } catch (e: any) {
      Alert.alert('Reset Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await clearUserSession();
    await supabase.auth.signOut().catch(() => {});
    setCurrentUser(null);
    Alert.alert('Signed Out', 'You are now browsing as Guest.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Close Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>‹ Close</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.badge}>
            {authMode === 'otp' ? 'SES VERIFICATION' : 'ACCOUNT & 30-DAY ACCESS'}
          </Text>
          <Text style={styles.title}>
            {currentUser 
              ? 'Your Profile' 
              : authMode === 'signup' 
              ? 'Create an Account' 
              : authMode === 'otp'
              ? 'Enter Email OTP'
              : authMode === 'forgot'
              ? 'Reset Password'
              : authMode === 'forgot_otp'
              ? 'Enter Reset Code'
              : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {currentUser
              ? `Logged in as ${currentUser.email} (30-day token active)`
              : authMode === 'otp'
              ? `Check your inbox (${email}) for the 6-digit code dispatched via AWS SES.`
              : 'Sign in to access all 20 classic tales, custom audio voices, and subscription features.'}
          </Text>
        </View>

        {currentUser ? (
          <View style={styles.profileCard}>
            <View style={styles.userAvatar}>
              <CrownIcon size={32} color="#d97706" />
            </View>
            <Text style={styles.profileEmail}>{currentUser.email}</Text>
            <Text style={styles.profileSub}>30-Day Session Active • Story Time Pro Ready</Text>

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {/* Mode Switcher (Login / Signup) */}
            {(authMode === 'login' || authMode === 'signup') && (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, authMode === 'login' && styles.activeTab]}
                  onPress={() => setAuthMode('login')}
                >
                  <Text style={[styles.tabText, authMode === 'login' && styles.activeTabText]}>Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, authMode === 'signup' && styles.activeTab]}
                  onPress={() => setAuthMode('signup')}
                >
                  <Text style={[styles.tabText, authMode === 'signup' && styles.activeTabText]}>Sign Up (SES)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* First & Last Name Fields (Signup only) */}
            {authMode === 'signup' && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>FIRST NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Umer"
                    placeholderTextColor="#9ca3af"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>LAST NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Farooq"
                    placeholderTextColor="#9ca3af"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>
            )}

            {/* Email Field */}
            {authMode !== 'otp' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="parent@example.com"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            )}

            {/* Password Field */}
            {(authMode === 'login' || authMode === 'signup' || authMode === 'forgot_otp') && (
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.inputLabel}>
                    {authMode === 'forgot_otp' ? 'NEW PASSWORD' : 'PASSWORD'}
                  </Text>
                  {authMode === 'login' && (
                    <TouchableOpacity onPress={() => setAuthMode('forgot')}>
                      <Text style={{ fontSize: 11, color: '#f59e0b', fontWeight: '700' }}>
                        Forgot password?
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[
                    styles.input,
                    (authMode === 'signup' || authMode === 'forgot_otp') && hasPassword && !isPasswordLengthValid && styles.inputWarning
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                {/* Live Password Length Hint */}
                {(authMode === 'signup' || authMode === 'forgot_otp') && hasPassword && (
                  <View style={styles.liveHintRow}>
                    {isPasswordLengthValid ? (
                      <View style={styles.hintBadgeSuccess}>
                        <CheckIcon size={11} color="#16a34a" />
                        <Text style={styles.hintTextSuccess}>Minimum 6 characters met</Text>
                      </View>
                    ) : (
                      <View style={styles.hintBadgeWarning}>
                        <Text style={styles.hintTextWarning}>
                          Must be at least 6 characters ({password.length}/6)
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Confirm Password Field with LIVE MATCH CONFIRMATION */}
            {(authMode === 'signup' || authMode === 'forgot_otp') && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={[
                    styles.input,
                    doPasswordsMatch && styles.inputSuccess,
                    isPasswordMismatch && styles.inputError
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                {/* LIVE CONFIRMATION FEEDBACK */}
                {hasConfirmPassword && (
                  <View style={styles.liveHintRow}>
                    {doPasswordsMatch ? (
                      <View style={styles.hintBadgeSuccess}>
                        <CheckIcon size={12} color="#16a34a" />
                        <Text style={styles.hintTextSuccess}>Passwords match perfectly</Text>
                      </View>
                    ) : (
                      <View style={styles.hintBadgeError}>
                        <CloseIcon size={12} color="#dc2626" />
                        <Text style={styles.hintTextError}>Passwords do not match yet</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* OTP Code Input for Signup & Reset */}
            {(authMode === 'otp' || authMode === 'forgot_otp') && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>6-DIGIT SES VERIFICATION CODE</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 22, fontWeight: '700' }]}
                  placeholder="123456"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
              </View>
            )}

            {loading ? (
              <ActivityIndicator size="large" color="#000000" style={{ paddingVertical: 14 }} />
            ) : (
              <View>
                {authMode === 'login' && (
                  <TouchableOpacity activeOpacity={0.88} style={styles.submitButton} onPress={handleLogin}>
                    <Text style={styles.submitButtonText}>Log In</Text>
                  </TouchableOpacity>
                )}

                {authMode === 'signup' && (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={[
                      styles.submitButton,
                      (!doPasswordsMatch || !isPasswordLengthValid || !email.trim()) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSignUpRequest}
                    disabled={!doPasswordsMatch || !isPasswordLengthValid || !email.trim()}
                  >
                    <Text style={styles.submitButtonText}>Send SES Verification Code</Text>
                  </TouchableOpacity>
                )}

                {authMode === 'otp' && (
                  <TouchableOpacity activeOpacity={0.88} style={styles.submitButton} onPress={handleVerifyOtp}>
                    <Text style={styles.submitButtonText}>Verify Code & Activate Session</Text>
                  </TouchableOpacity>
                )}

                {authMode === 'forgot' && (
                  <TouchableOpacity activeOpacity={0.88} style={styles.submitButton} onPress={handleForgotPasswordRequest}>
                    <Text style={styles.submitButtonText}>Send Reset Code via SES</Text>
                  </TouchableOpacity>
                )}

                {authMode === 'forgot_otp' && (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={[
                      styles.submitButton,
                      (!doPasswordsMatch || !isPasswordLengthValid) && styles.submitButtonDisabled
                    ]}
                    onPress={handleResetPasswordVerify}
                    disabled={!doPasswordsMatch || !isPasswordLengthValid}
                  >
                    <Text style={styles.submitButtonText}>Reset Password</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Back to Login navigation */}
            {(authMode === 'otp' || authMode === 'forgot' || authMode === 'forgot_otp') && (
              <TouchableOpacity style={styles.guestButton} onPress={() => setAuthMode('login')}>
                <Text style={styles.guestButtonText}>← Back to Log In</Text>
              </TouchableOpacity>
            )}

            {/* Guest Trial Option */}
            <TouchableOpacity style={styles.guestButton} onPress={() => navigation.goBack()}>
              <Text style={styles.guestButtonText}>Continue as Guest (10-Min Free Trial)</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingTop: 10,
    paddingBottom: 40
  },
  closeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 10
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#d97706',
    backgroundColor: '#fef3c7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'Georgia',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12
  },
  formContainer: {
    marginTop: 8
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  activeTabText: {
    color: '#111827'
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#4b5563',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 13,
    fontSize: 15,
    color: '#111827'
  },
  inputSuccess: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4'
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2'
  },
  inputWarning: {
    borderColor: '#f59e0b'
  },
  liveHintRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center'
  },
  hintBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#dcfce7'
  },
  hintTextSuccess: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803d'
  },
  hintBadgeError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#fee2e2'
  },
  hintTextError: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#b91c1c'
  },
  hintBadgeWarning: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#fef3c7'
  },
  hintTextWarning: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#b45309'
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0.05
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8
  },
  guestButtonText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600'
  },
  profileCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  profileEmail: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4
  },
  profileSub: {
    fontSize: 12.5,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20
  },
  signOutButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20
  },
  signOutButtonText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700'
  }
});
