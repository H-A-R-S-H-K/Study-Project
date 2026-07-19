import { config } from '../../config';
import type { Coordinate } from './geolocation';

/**
 * Google Places API (New) — powers the Uber-style "type an address, pick from
 * suggestions" flow. Two calls:
 *   1. autocomplete(input) → a list of suggestions as the user types.
 *   2. placeDetails(placeId) → the coordinate for the chosen suggestion.
 * A session token groups the two for correct billing. All failures return
 * empty/null so the UI degrades to the manual "Set on map" fallback.
 */

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';

/** Opaque per-search session token (groups autocomplete + details for billing). */
export function newSessionToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function autocomplete(
  input: string,
  sessionToken: string,
): Promise<PlaceSuggestion[]> {
  const q = input.trim();
  if (q.length < 3 || !config.googleApiKey) return [];
  try {
    const res = await fetch(AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': config.googleApiKey,
      },
      body: JSON.stringify({
        input: q,
        sessionToken,
        includedRegionCodes: ['in'], // bias to India; drop for global
      }),
    });
    const json = (await res.json()) as {
      suggestions?: {
        placePrediction?: {
          placeId: string;
          structuredFormat?: {
            mainText?: { text: string };
            secondaryText?: { text: string };
          };
          text?: { text: string };
        };
      }[];
    };
    return (json.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({
        placeId: p.placeId,
        mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
      }));
  } catch {
    return [];
  }
}

export async function placeDetails(
  placeId: string,
  sessionToken: string,
): Promise<{ coordinate: Coordinate; formattedAddress: string } | null> {
  if (!config.googleApiKey) return null;
  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?sessionToken=${sessionToken}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': config.googleApiKey,
        'X-Goog-FieldMask': 'location,formattedAddress',
      },
    });
    const json = (await res.json()) as {
      location?: { latitude: number; longitude: number };
      formattedAddress?: string;
    };
    if (!json.location) return null;
    return {
      coordinate: { latitude: json.location.latitude, longitude: json.location.longitude },
      formattedAddress: json.formattedAddress ?? '',
    };
  } catch {
    return null;
  }
}
