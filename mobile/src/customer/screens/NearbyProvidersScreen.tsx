import React from 'react';
import { View, StyleSheet, FlatList, Linking } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import {
  Text,
  Card,
  Chip,
  Button,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useCurrentLocation } from '../../maps/hooks/useCurrentLocation';
import { useNearbyProviders } from '../../maps/hooks/useNearbyProviders';
import type { NearbyProvider } from '../../maps/api/discoveryApi';
import { VEHICLE_TYPES, type VehicleType } from '../../types/domain';
import { EmptyState } from '../../common/components/EmptyState';
import { formatDistance } from '../../maps/utils/format';
import { spacing } from '../../theme';

/**
 * Customer home: shows available providers around the user on a map plus a
 * scrollable list, with an optional vehicle-type filter. Distances are display
 * only. "Call" opens the dialer — no fare, no booking here (that's Phase 5/6).
 */
export function NearbyProvidersScreen(): React.JSX.Element {
  const theme = useTheme();
  const { coordinate, loading: locating, error: locError, refresh } = useCurrentLocation();
  const [typeFilter, setTypeFilter] = React.useState<VehicleType | undefined>();

  const params = coordinate
    ? { lng: coordinate.longitude, lat: coordinate.latitude, radius: 15_000, type: typeFilter }
    : null;
  const { data: providers, isLoading } = useNearbyProviders(params);

  if (locating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.hint}>Finding your location…</Text>
      </View>
    );
  }

  if (locError || !coordinate) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="📍"
          title="Location needed"
          subtitle="We use your location to show providers near you."
        />
        <Button mode="contained" onPress={refresh} style={styles.retry}>
          Enable location
        </Button>
      </View>
    );
  }

  const region: Region = {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MapView style={styles.map} initialRegion={region} showsUserLocation>
        {(providers ?? [])
          .filter((p) => p.location)
          .map((p) => (
            <Marker
              key={`${p.kind}-${p.id}`}
              coordinate={{
                latitude: p.location!.coordinates[1],
                longitude: p.location!.coordinates[0],
              }}
              title={p.kind === 'vehicle' ? p.title : p.provider.name}
              description={`${p.provider.name} · ${formatDistance(p.distanceMeters)}`}
              pinColor={p.kind === 'vehicle' ? theme.colors.primary : theme.colors.tertiary}
            />
          ))}
      </MapView>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['all', ...VEHICLE_TYPES]}
          keyExtractor={(t) => t}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const selected = item === 'all' ? !typeFilter : typeFilter === item;
            return (
              <Chip
                selected={selected}
                showSelectedOverlay
                onPress={() => setTypeFilter(item === 'all' ? undefined : (item as VehicleType))}
              >
                {item === 'all' ? 'All' : item.replace('_', ' ')}
              </Chip>
            );
          }}
        />
      </View>

      <FlatList
        data={providers ?? []}
        keyExtractor={(p) => `${p.kind}-${p.id}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          isLoading ? <ActivityIndicator style={styles.listLoader} /> : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🔍"
              title="No providers nearby"
              subtitle="Try widening your search or removing the filter."
            />
          ) : null
        }
        renderItem={({ item }) => <ProviderRow provider={item} />}
      />
    </View>
  );
}

function ProviderRow({ provider }: { provider: NearbyProvider }): React.JSX.Element {
  const title = provider.kind === 'vehicle' ? provider.title : `${provider.provider.name} (driver)`;
  const subtitle =
    provider.kind === 'vehicle'
      ? `${provider.type.replace('_', ' ')} · ${formatDistance(provider.distanceMeters)}`
      : `${provider.experienceYears} yrs · ${formatDistance(provider.distanceMeters)}`;

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Title
        title={title}
        subtitle={subtitle}
        right={() => (
          <Button
            compact
            icon="phone"
            onPress={() => Linking.openURL(`tel:${provider.provider.phone}`)}
          >
            Call
          </Button>
        )}
      />
      <Card.Content style={styles.cardMeta}>
        <Chip compact icon="star">
          {provider.provider.rating.average.toFixed(1)}
        </Chip>
        {(provider.kind === 'vehicle' && provider.verifiedRegistration) ||
        (provider.kind === 'driver' && provider.licenseVerified) ? (
          <Chip compact icon="check-decagram">
            Verified
          </Chip>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  hint: { marginTop: spacing.md, opacity: 0.7 },
  retry: { marginTop: spacing.lg },
  map: { height: '42%' },
  filters: { paddingVertical: spacing.sm },
  filterRow: { paddingHorizontal: spacing.md, gap: spacing.sm },
  list: { padding: spacing.md, flexGrow: 1 },
  listLoader: { marginVertical: spacing.md },
  card: { marginBottom: spacing.md },
  cardMeta: { flexDirection: 'row', gap: spacing.sm },
});
