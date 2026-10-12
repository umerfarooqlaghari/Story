import { registerRootComponent } from 'expo';

import App from './App';
import { setupRevenueCat } from './lib/clients';

// Initialize RevenueCat safely before root component mounts
try {
  setupRevenueCat();
} catch (e) {
  console.warn('[Bootstrap] RevenueCat bootstrap warning:', e);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
