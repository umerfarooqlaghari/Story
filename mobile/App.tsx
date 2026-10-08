import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { registerForPushNotificationsAsync } from './lib/notifications';
import Constants from 'expo-constants';

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    registerForPushNotificationsAsync(projectId)
      .then((token) => {
        setExpoPushToken(token);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Story</Text>
      <Text style={styles.subtitle}>Welcome to Story Mobile</Text>
      
      <View style={styles.tokenCard}>
        <Text style={styles.tokenLabel}>Expo Push Notifications:</Text>
        {loading ? (
          <ActivityIndicator color="#8b5cf6" style={{ marginTop: 8 }} />
        ) : expoPushToken ? (
          <Text style={styles.tokenValue} numberOfLines={2} ellipsizeMode="middle">
            {expoPushToken}
          </Text>
        ) : (
          <Text style={styles.tokenEmpty}>
            Notifications ready (Push tokens are generated on physical devices)
          </Text>
        )}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 32,
  },
  tokenCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tokenLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8b5cf6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tokenValue: {
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  tokenEmpty: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
  },
});
