/**
 * Polyfills are imported first and as a side-effect module, so they are evaluated
 * before the app tree. Do not inline them here — see the note in `src/polyfills`.
 */
import '@/polyfills';

import { registerRootComponent } from 'expo';

import App from '@/app/App';

registerRootComponent(App);
