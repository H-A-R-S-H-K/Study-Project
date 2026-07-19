import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { useTheme } from 'react-native-paper';
import { fetchRoute } from '../services/directions';
import type { Coordinate } from '../services/geolocation';

const INDIA: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 6,
  longitudeDelta: 6,
};

/**
 * A read-only route preview, like a cab app's trip map: a green pickup marker,
 * a red destination marker, and the road route drawn between them (falls back to
 * a straight line if Directions is unavailable). Auto-fits to show both points.
 */
export function RouteMap({
  pickup,
  destination,
}: {
  pickup: Coordinate | null;
  destination: Coordinate | null;
}): React.JSX.Element {
  const theme = useTheme();
  const mapRef = React.useRef<MapView>(null);
  const [route, setRoute] = React.useState<Coordinate[]>([]);

  // Fetch (or fall back to) the route whenever both endpoints are known.
  React.useEffect(() => {
    let active = true;
    if (pickup && destination) {
      void fetchRoute(pickup, destination).then((pts) => {
        if (active) setRoute(pts);
      });
    } else {
      setRoute([]);
    }
    return () => {
      active = false;
    };
  }, [pickup?.latitude, pickup?.longitude, destination?.latitude, destination?.longitude]);

  // Keep both markers (and the route) in frame. Fit to the actual road route
  // when we have it (tighter, road-hugging) rather than just the two endpoints.
  React.useEffect(() => {
    const pts =
      route.length >= 2
        ? route
        : ([pickup, destination].filter(Boolean) as Coordinate[]);
    if (pts.length === 0) return;
    const timer = setTimeout(() => {
      if (pts.length === 1) {
        mapRef.current?.animateToRegion(
          { ...pts[0], latitudeDelta: 0.02, longitudeDelta: 0.02 },
          500,
        );
      } else {
        mapRef.current?.fitToCoordinates(pts, {
          edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
          animated: true,
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [pickup?.latitude, pickup?.longitude, destination?.latitude, destination?.longitude, route]);

  const initialRegion: Region = pickup
    ? { ...pickup, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : INDIA;

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={initialRegion}>
        {pickup && (
          <Marker coordinate={pickup} title="Pickup" pinColor={theme.colors.primary} />
        )}
        {destination && (
          <Marker coordinate={destination} title="Destination" pinColor={theme.colors.error} />
        )}
        {route.length >= 2 && (
          <Polyline
            coordinates={route}
            strokeWidth={7}
            strokeColor={theme.colors.primary}
            lineCap="round"
            lineJoin="round"
            geodesic
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 340, borderRadius: 12, overflow: 'hidden' },
});
