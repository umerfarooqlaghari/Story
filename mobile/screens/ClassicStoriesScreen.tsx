import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/clients';

export default function ClassicStoriesScreen({ navigation }: any) {
  const [stories, setStories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchClassics();
  }, []);

  const fetchClassics = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('is_classic', true);
      
    if (data) setStories(data);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classic Stories</Text>
      {loading ? <ActivityIndicator size="large" color="#ec4899" /> : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('Player', { story: item, isClassic: true })}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#8b5cf6', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#334155' }
});
