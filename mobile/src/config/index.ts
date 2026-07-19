// The Google API key lives in an untracked file (keys.local.ts) so it never
// gets committed. Copy keys.local.example.ts → keys.local.ts and paste your key.
import { GOOGLE_API_KEY } from './keys.local';

/**
 * App configuration. In production these come from build-time env (react-native-config);
 * defaults here target a local backend during development.
 */
export const config = {
  // 10.0.2.2 = the host machine's localhost as seen from the Android emulator.
  // Backend dev server runs on 5055 (see backend/.env).
  apiBaseUrl: 'http://10.0.2.2:5055/api/v1',
  socketUrl: 'http://10.0.2.2:5055',
  nearbyRadiusMeters: 15_000,
  requestTimeoutMs: 20_000,
  // Google key for Maps/Places/Routes/Geocoding. Loaded from keys.local.ts
  // (gitignored). If empty, the app falls back to manual pin + straight-line route.
  googleApiKey: GOOGLE_API_KEY,
} as const;
