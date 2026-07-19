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
  // Google key for the Geocoding + Directions web services (address search and
  // route drawing). Enable "Geocoding API" and "Directions API" on this key in
  // Google Cloud, and don't restrict it to Android apps only (web-service calls
  // can't send a package/SHA-1). If it's unset/blocked, the app falls back to
  // manual map-pin selection and a straight-line route.
  googleApiKey: 'AIzaSyCXnGS7zvopefcnUgVNEgRNRpz8azzd9RE',
} as const;
