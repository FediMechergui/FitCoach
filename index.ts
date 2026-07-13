import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether the app is loaded in Expo Go or a native build,
// the environment is set up appropriately.
registerRootComponent(App);
