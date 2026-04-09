import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { getCurrentPosition, type Coordinate } from '../services/geolocation';
import { spacing } from '../../theme';

const DEFAULT_REGION: Region = {
  // Central India fallback until we have a fix.
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * A "drag the map under a fixed pin" location picker (cheaper and steadier than
 * a draggable marker). The centre of the map is the selected point; the parent
 * receives it via `onChange` and pairs it with a typed address elsewhere. Used
 * for pickup/destination selection in Phase 5.
 */
export function LocationPicker({
  initial,
  onChange,
}: {
  initial?: Coordinate;
  onChange: (c: Coordinate) => void;
}): React.JSX.Element {
  const theme = useTheme();
  const mapRef = React.useRef<MapView>(null);
  const [region, setRegion] = React.useState<Region>(
    initial ? { ...DEFAULT_REGION, ...initial } : DEFAULT_REGION,
  );

  const recenterToUser = React.useCallback(async () => {
    try {
      const c = await getCurrentPosition();
      const next = { ...region, latitude: c.latitude, longitude: c.longitude };
      setRegion(next);
      mapRef.current?.animateToRegion(next, 400);
      onChange(c);
    } catch {
      /* keep current region if location is unavailable */
    }
  }, [region, onChange]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={(r) => {
          setRegion(r);
          onChange({ latitude: r.latitude, longitude: r.longitude });
        }}
      />
      {/* Fixed centre pin — the map moves beneath it. */}
      <View pointerEvents="none" style={styles.pinContainer}>
        <Text style={[styles.pin, { color: theme.colors.primary }]}>📍</Text>
      </View>
      <IconButton
        icon="crosshairs-gps"
        mode="contained"
        style={styles.gps}
        onPress={recenterToUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  pinContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: { fontSize: 40, marginBottom: 40 }, // offset so the tip sits at centre
  gps: { position: 'absolute', right: spacing.md, bottom: spacing.md },
});
