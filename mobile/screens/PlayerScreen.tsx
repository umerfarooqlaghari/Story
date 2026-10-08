import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';

export default function PlayerScreen({ route }: any) {
  const { story } = route.params;
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return sound
      ? () => { sound.unloadAsync(); }
      : undefined;
  }, [sound]);

  const playAudio = async () => {
    if (!story.audio_url) return;
    const { sound: newSound } = await Audio.Sound.createAsync(
       { uri: story.audio_url }
    );
    setSound(newSound);
    await newSound.playAsync();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{story.title}</Text>
      <Button title="▶ Play Story" onPress={playAudio} />
      <View style={styles.contentContainer}>
         <Text style={styles.content}>{story.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  contentContainer: { marginTop: 30 },
  content: { fontSize: 16, lineHeight: 24, color: '#333' }
});
