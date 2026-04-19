import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Chip, Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useCurrentLocation } from '../../maps/hooks/useCurrentLocation';
import { useRequestFeed } from '../hooks/useRequests';
import { SERVICE_TYPE_LABEL } from '../../types/domain';
import { formatSchedule } from '../utils/requestDisplay';
import { formatDistance } from '../../maps/utils/format';
import { EmptyState } from '../../common/components/EmptyState';
import { spacing } from '../../theme';

/**
 * Provider's nearby-request feed. The backend already scopes results to what the
 * provider's role can fulfil (vehicle owners vs drivers, drivable categories);
 * this screen just renders them nearest-first with a "Make offer" CTA (Phase 6).
 */
export function RequestFeedScreen(): React.JSX.Element {
  const theme = useTheme();
  const { coordinate, loading: locating, error: locError, refresh } = useCurrentLocation();

  const params = coordinate
    ? { lng: coordinate.longitude, lat: coordinate.latitude, radius: 15_000 }
    : null;
  const { data: requests, isLoading, refetch, isRefetching } = useRequestFeed(params);

  if (locating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.hint}>Finding requests near you…</Text>
      </View>
    );
  }

  if (locError || !coordinate) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="📍"
          title="Location needed"
          subtitle="We use your location to show requests near you."
        />
        <Button mode="contained" onPress={refresh} style={styles.retry}>
          Enable location
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={requests ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={isLoading ? <ActivityIndicator style={styles.loader} /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🧭"
              title="No requests nearby"
              subtitle="New requests you can fulfil will appear here."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card mode="outlined" style={styles.card}>
            <Card.Title
              title={`${item.pickup.address} → ${item.destination.address}`}
              titleNumberOfLines={2}
              subtitle={`${item.customer.name} · ⭐ ${item.customer.rating.average.toFixed(1)}`}
            />
            <Card.Content style={styles.chips}>
              <Chip compact icon="map-marker-distance">
                {formatDistance(item.distanceMeters)}
              </Chip>
              <Chip compact>{SERVICE_TYPE_LABEL[item.serviceType]}</Chip>
              {item.vehicleType && <Chip compact>{item.vehicleType.replace('_', ' ')}</Chip>}
            </Card.Content>
            <Card.Content>
              <Text variant="labelMedium" style={styles.dim}>
                {formatSchedule(item.scheduledAt)}
              </Text>
              {item.description ? <Text variant="bodyMedium">{item.description}</Text> : null}
            </Card.Content>
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() => {
                  /* Make offer — Phase 6 */
                }}
              >
                Make offer
              </Button>
            </Card.Actions>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  hint: { marginTop: spacing.md, opacity: 0.7 },
  retry: { marginTop: spacing.lg },
  list: { padding: spacing.md, flexGrow: 1 },
  loader: { marginVertical: spacing.md },
  card: { marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  dim: { opacity: 0.6, marginBottom: spacing.xs },
});
