import { useCallback, useEffect, useState } from 'react';
import { getCurrentPosition, type Coordinate } from '../services/geolocation';

interface State {
  coordinate: Coordinate | null;
  loading: boolean;
  error: string | null;
}

/**
 * Resolves the device's current position on mount and exposes a `refresh` to
 * re-request it (e.g. after the user enables permission in settings).
 */
export function useCurrentLocation(): State & { refresh: () => void } {
  const [state, setState] = useState<State>({
    coordinate: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const coordinate = await getCurrentPosition();
      setState({ coordinate, loading: false, error: null });
    } catch (err) {
      setState({
        coordinate: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Location unavailable',
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, refresh: load };
}
