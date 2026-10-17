import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const SparkleIcon = ({ size = 12, color = '#7c3aed' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
  </Svg>
);

const LockIcon = ({ size = 16, color = '#64748b' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const PROMPT_SUGGESTIONS = [
  'A friendly dragon who loves stargazing',
  'A little teddy bear lost in an enchanted toy shop',
  'A courageous squirrel learning to fly a leaf kite',
  'The secret midnight bakery of sleeping mice'
];

const CURATED_VOICES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'Storyteller' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Soothing' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', desc: 'Calm & Sweet' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', desc: 'Adventurous' }
];

export default function GenerateStoryScreen({ navigation }: any) {
  const [theme] = useState('');
  const [selectedVoice] = useState('JBFqnCBsd6RMkjVDRZzb');

  const showLockedNotice = () => {
    Alert.alert(
      'Coming Soon 🌙',
      'Custom AI Bedtime Story generation is currently in private beta and will be fully unlocked in our upcoming update!\n\nIn the meantime, enjoy all 20 full-length classic fairy tales in your library.',
      [{ text: 'Explore Classics', onPress: () => navigation.goBack() }, { text: 'Got it' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Close</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>AI STORY MAKER</Text>
          <Text style={styles.title}>Create a New Book</Text>
          <Text style={styles.desc}>
            Describe any character or bedtime theme, and our AI will weave a magical tale voiced by ElevenLabs.
          </Text>
        </View>

        {/* LOCKED BANNER */}
        <View style={styles.comingSoonBanner}>
          <View style={styles.badgeRow}>
            <View style={styles.lockBadge}>
              <LockIcon size={14} color="#b45309" />
              <Text style={styles.lockBadgeText}>FEATURE IN PRIVATE BETA • COMING SOON</Text>
            </View>
          </View>
          <Text style={styles.comingSoonBannerDesc}>
            Custom AI story creation with real-time ElevenLabs voiceover is undergoing final studio tuning. It will be fully unlocked in our next update!
          </Text>
        </View>

        {/* Input (Locked Preview) */}
        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>STORY IDEA OR TOPIC</Text>
            <LockIcon size={12} color="#94a3b8" />
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={showLockedNotice}>
            <TextInput
              style={[styles.input, styles.lockedInput]}
              placeholder="e.g. A shy little hedgehog finding true friends..."
              placeholderTextColor="#9ca3af"
              value={theme}
              editable={false}
              multiline
              numberOfLines={3}
            />
          </TouchableOpacity>
        </View>

        {/* Quick Suggestions (Locked Preview) */}
        <View style={styles.suggestionsSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>INSPIRATION IDEAS</Text>
            <LockIcon size={12} color="#94a3b8" />
          </View>
          <View style={styles.suggestionChips}>
            {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, styles.lockedChip]}
                onPress={showLockedNotice}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <SparkleIcon size={12} color="#94a3b8" />
                  <Text style={[styles.chipText, { color: '#64748b' }]}>{suggestion}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice Selection (Locked Preview) */}
        <View style={styles.voiceSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>SELECT ELEVENLABS NARRATOR</Text>
            <LockIcon size={12} color="#94a3b8" />
          </View>
          <View style={styles.voiceRow}>
            {CURATED_VOICES.map((v) => {
              const active = selectedVoice === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  onPress={showLockedNotice}
                  activeOpacity={0.7}
                  style={[styles.voiceCard, active && styles.activeVoiceCard, styles.lockedVoiceCard]}
                >
                  <Text style={[styles.voiceName, active && styles.activeVoiceName]}>{v.name}</Text>
                  <Text style={[styles.voiceDesc, active && styles.activeVoiceDesc]}>{v.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Generate Button (LOCKED) */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.lockedButton}
            activeOpacity={0.75}
            onPress={showLockedNotice}
          >
            <LockIcon size={17} color="#475569" />
            <Text style={styles.lockedButtonText}>Coming Soon • Studio Locked</Text>
          </TouchableOpacity>
          <Text style={styles.lockedSubtext}>
            Enjoy 20 timeless classic fairy tales with studio audio while this feature is in private beta.
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
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 8
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827'
  },
  header: {
    marginBottom: 18,
    alignItems: 'center'
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#6b7280',
    marginBottom: 4
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  desc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16
  },
  comingSoonBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
    gap: 6
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  lockBadge: {
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.5
  },
  comingSoonBannerDesc: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 17,
    fontWeight: '500'
  },
  inputContainer: {
    marginBottom: 20
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#4b5563'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 80
  },
  lockedInput: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.7
  },
  suggestionsSection: {
    marginBottom: 22
  },
  suggestionChips: {
    gap: 8
  },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  lockedChip: {
    backgroundColor: '#f8fafc',
    opacity: 0.75
  },
  chipText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600'
  },
  voiceSection: {
    marginBottom: 28
  },
  voiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  voiceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  activeVoiceCard: {
    backgroundColor: '#e2e8f0',
    borderColor: '#94a3b8'
  },
  lockedVoiceCard: {
    opacity: 0.8
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827'
  },
  activeVoiceName: {
    color: '#0f172a'
  },
  voiceDesc: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2
  },
  activeVoiceDesc: {
    color: '#475569'
  },
  actionContainer: {
    marginTop: 8,
    alignItems: 'center',
    gap: 10
  },
  lockedButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  lockedButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  lockedSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16
  }
});
