import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

export default function GenerateStoryScreen({ navigation }: any) {
  const { isPremium } = useSubscription();
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);

  const generateStory = async () => {
    if (!isPremium) {
      alert("Please upgrade to premium to generate stories!");
      return;
    }
    setLoading(true);
    try {
        // Assume user is authenticated and we have their ID
        const userId = "USER_UUID_HERE"; 
        const res = await fetch('http://localhost:8000/generate-story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, theme })
        });
        const data = await res.json();
        navigation.navigate('Player', { story: data });
    } catch (e) {
        alert("Failed to generate story: " + e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What should the story be about?</Text>
      <TextInput 
        style={styles.input}
        placeholder="e.g. A brave little dragon learning to fly"
        value={theme}
        onChangeText={setTheme}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Generate Magical Story" onPress={generateStory} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 10, marginBottom: 20 }
});
