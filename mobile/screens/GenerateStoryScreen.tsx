import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { supabase } from '../lib/clients';
import { API_BASE_URL } from '../lib/config';
import Svg, { Path } from 'react-native-svg';

const SparkleIcon = ({ size = 12, color = '#7c3aed' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
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
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Clear' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', desc: 'Adventurous' }
];

export default function GenerateStoryScreen({ navigation }: any) {
  const [theme, setTheme] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('JBFqnCBsd6RMkjVDRZzb');
  const [loading, setLoading] = useState(false);

  const generateStory = async () => {
    if (!theme.trim()) {
      alert('Please enter a story theme or tap one of the suggestions!');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      const res = await fetch(`${API_BASE_URL}/generate-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          theme: theme.trim(),
          voice_id: selectedVoice
        })
      });

      const data = await res.json();
      if (data && data.title) {
        navigation.navigate('Player', { story: data });
      } else {
        alert('Could not generate story right now.');
      }
    } catch (e: any) {
      alert('Generation error: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Close</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.subtitle}>AI STORY MAKER</Text>
          <Text style={styles.title}>Create a New Book</Text>
          <Text style={styles.desc}>
            Describe any character or bedtime theme, and our AI will weave a magical tale voiced by ElevenLabs.
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>STORY IDEA OR TOPIC</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. A shy little hedgehog finding true friends..."
            placeholderTextColor="#9ca3af"
            value={theme}
            onChangeText={setTheme}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Quick Suggestions */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.label}>INSPIRATION IDEAS</Text>
          <View style={styles.suggestionChips}>
            {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chip}
                onPress={() => setTheme(suggestion)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <SparkleIcon size={12} color="#7c3aed" />
                  <Text style={styles.chipText}>{suggestion}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice Selection */}
        <View style={styles.voiceSection}>
          <Text style={styles.label}>SELECT ELEVENLABS NARRATOR</Text>
          <View style={styles.voiceRow}>
            {CURATED_VOICES.map((v) => {
              const active = selectedVoice === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => setSelectedVoice(v.id)}
                  style={[styles.voiceCard, active && styles.activeVoiceCard]}
                >
                  <Text style={[styles.voiceName, active && styles.activeVoiceName]}>{v.name}</Text>
                  <Text style={[styles.voiceDesc, active && styles.activeVoiceDesc]}>{v.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Generate Button */}
        <View style={styles.actionContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>Crafting tale and ElevenLabs narration...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.generateButton}
              activeOpacity={0.88}
              onPress={generateStory}
            >
              <Text style={styles.generateButtonText}>Generate & Add to Bookshelf</Text>
            </TouchableOpacity>
          )}
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
    marginBottom: 26,
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
    fontFamily: 'Georgia',
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
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#4b5563',
    marginBottom: 8
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
    backgroundColor: '#000000',
    borderColor: '#000000'
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827'
  },
  activeVoiceName: {
    color: '#ffffff'
  },
  voiceDesc: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2
  },
  activeVoiceDesc: {
    color: '#cbd5e1'
  },
  actionContainer: {
    marginTop: 8,
    alignItems: 'center'
  },
  generateButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10
  },
  loadingText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600'
  }
});
