import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

export default function PlayerScreen({ route }: any) {
  const { story } = route.params;
  const player = useAudioPlayer(story?.audio_url ? { uri: story.audio_url } : null);

  const togglePlayback = () => {
    if (!story?.audio_url) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{story?.title}</Text>
      <Button 
        title={player.playing ? "⏸ Pause Story" : "▶ Play Story"} 
        onPress={togglePlayback} 
        disabled={!story?.audio_url}
      />
      <View style={styles.contentContainer}>
         <Text style={styles.content}>{story?.content}</Text>
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
