import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  type Permission,
} from 'react-native-permissions';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

const LOCATION_PERMISSION: Permission =
  Platform.OS === 'ios'
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

/**
 * Ensures foreground location permission, requesting it if needed. Returns
 * whether we may read the device position — screens use this to show a rationale
 * / "enable location" state instead of silently failing.
 */
export async function ensureLocationPermission(): Promise<boolean> {
  const status = await check(LOCATION_PERMISSION);
  if (status === RESULTS.GRANTED) return true;
  if (status === RESULTS.BLOCKED || status === RESULTS.UNAVAILABLE) return false;
  const result = await request(LOCATION_PERMISSION);
  return result === RESULTS.GRANTED;
}

/**
 * Reads the current device position once. Rejects with a readable error if
 * permission is denied or the fix times out. Coordinates are returned as
 * {latitude, longitude} (react-native-maps convention); convert to GeoJSON
 * [lng, lat] only at the API boundary.
 */
export async function getCurrentPosition(): Promise<Coordinate> {
  const granted = await ensureLocationPermission();
  if (!granted) throw new Error('Location permission denied');

  return new Promise<Coordinate>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos) =>
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Could not get your location')),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 10_000 },
    );
  });
}

/** GeoJSON [lng, lat] for the API from a map {latitude, longitude}. */
export const toGeoJson = (c: Coordinate): [number, number] => [c.longitude, c.latitude];
