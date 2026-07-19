import { config } from '../../config';
import type { Coordinate } from './geolocation';

/**
 * Thin wrappers over Google's Geocoding + Directions web services, used to (a)
 * turn a typed address into a map point and (b) draw the road route between
 * pickup and destination. Both degrade gracefully: geocoding returns null on
 * failure (the user can still drop a pin), and route fetching falls back to a
 * straight line so the map always shows *a* path.
 */

interface GeocodeResult {
  coordinate: Coordinate;
  formattedAddress: string;
}

/** Address text → coordinate (+ tidy formatted address). Null if not found. */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q || !config.googleApiKey) return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}` +
      `&key=${config.googleApiKey}`;
    const res = await fetch(url);
    const json = (await res.json()) as {
      status: string;
      results: { geometry: { location: { lat: number; lng: number } }; formatted_address: string }[];
    };
    const first = json.results?.[0];
    if (json.status !== 'OK' || !first) return null;
    return {
      coordinate: { latitude: first.geometry.location.lat, longitude: first.geometry.location.lng },
      formattedAddress: first.formatted_address,
    };
  } catch {
    return null;
  }
}

/**
 * Real road route between two points as coordinates for a Polyline, via Google's
 * Routes API (the modern replacement for the legacy Directions API). Falls back
 * to a straight [origin, destination] line if Routes is unavailable, so the map
 * always renders *a* path.
 */
export async function fetchRoute(
  origin: Coordinate,
  destination: Coordinate,
): Promise<Coordinate[]> {
  const straightLine = [origin, destination];
  if (!config.googleApiKey) return straightLine;
  try {
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': config.googleApiKey,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: {
          location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } },
        },
        destination: {
          location: {
            latLng: { latitude: destination.latitude, longitude: destination.longitude },
          },
        },
        travelMode: 'DRIVE',
      }),
    });
    const json = (await res.json()) as {
      routes?: { polyline?: { encodedPolyline?: string } }[];
    };
    const encoded = json.routes?.[0]?.polyline?.encodedPolyline;
    return encoded ? decodePolyline(encoded) : straightLine;
  } catch {
    return straightLine;
  }
}

/**
 * Decodes Google's encoded-polyline format into coordinates.
 * (Standard algorithm — https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
 */
export function decodePolyline(encoded: string): Coordinate[] {
  const points: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}
