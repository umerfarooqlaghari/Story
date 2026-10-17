import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GenerateStoryScreen from './screens/GenerateStoryScreen';
import PlayerScreen from './screens/PlayerScreen';
import HomeScreen from './screens/HomeScreen';
import ClassicStoriesScreen from './screens/ClassicStoriesScreen';
import AuthScreen from './screens/AuthScreen';
import PaywallScreen from './screens/PaywallScreen';

const Stack = createNativeStackNavigator();

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[Root ErrorBoundary Caught]:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>
            StoryTime
          </Text>
          <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'Something went wrong while launching StoryTime.'}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#0f172a', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#ffffff' }
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Paywall" component={PaywallScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Classics" component={ClassicStoriesScreen} />
            <Stack.Screen name="GenerateStory" component={GenerateStoryScreen} />
            <Stack.Screen name="Generate" component={GenerateStoryScreen} />
            <Stack.Screen name="Player" component={PlayerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
