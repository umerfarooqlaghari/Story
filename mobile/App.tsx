import React from 'react';
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

export default function App() {
  return (
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
          <Stack.Screen name="Generate" component={GenerateStoryScreen} />
          <Stack.Screen name="Player" component={PlayerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
