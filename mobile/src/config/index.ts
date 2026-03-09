/**
 * App configuration. In production these come from build-time env (react-native-config);
 * defaults here target a local backend during development.
 */
export const config = {
  apiBaseUrl: 'http://10.0.2.2:5000/api/v1', // 10.0.2.2 = host loopback from Android emulator
  socketUrl: 'http://10.0.2.2:5000',
  nearbyRadiusMeters: 15_000,
  requestTimeoutMs: 20_000,
} as const;
