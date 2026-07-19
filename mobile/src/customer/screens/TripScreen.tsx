import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip, Button, Divider, ActivityIndicator, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { RouteMap } from '../../maps/components/RouteMap';
import { useRequest } from '../hooks/useRequests';
import { useCompleteRequest } from '../../offers/hooks/useOffers';
import { useRatingStatus } from '../../ratings/hooks/useRatings';
import { STATUS_LABEL, formatSchedule } from '../utils/requestDisplay';
import { SERVICE_TYPE_LABEL } from '../../types/domain';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Trip'>;

/**
 * The "on-trip" screen, cab-app style: a big route map (pickup → destination
 * along real roads) with the ride details and the actions for this stage of the
 * job (message, complete, rate). Shared by customer and provider.
 */
export function TripScreen({ route, navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { requestId } = route.params;
  const { data: request, isLoading } = useRequest(requestId);
  const { data: ratingStatus } = useRatingStatus(requestId);
  const complete = useCompleteRequest();

  if (isLoading || !request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const toCoord = (c: [number, number]): { latitude: number; longitude: number } => ({
    latitude: c[1],
    longitude: c[0],
  });
  const pickup = toCoord(request.pickup.location.coordinates);
  const destination = toCoord(request.destination.location.coordinates);
  const other = ratingStatus?.ratee?.name;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <RouteMap pickup={pickup} destination={destination} />

      <Card mode="outlined" style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="titleMedium">{other ? `With ${other}` : 'Your ride'}</Text>
            <Chip compact>{STATUS_LABEL[request.status]}</Chip>
          </View>
          <Divider style={styles.divider} />

          <Text variant="labelSmall" style={styles.dim}>
            PICKUP
          </Text>
          <Text variant="bodyMedium">{request.pickup.address}</Text>
          <Text variant="labelSmall" style={[styles.dim, styles.gap]}>
            DESTINATION
          </Text>
          <Text variant="bodyMedium">{request.destination.address}</Text>

          <View style={styles.chips}>
            <Chip compact icon="clock-outline">
              {formatSchedule(request.scheduledAt)}
            </Chip>
            <Chip compact>{SERVICE_TYPE_LABEL[request.serviceType]}</Chip>
            {request.vehicleType && <Chip compact>{request.vehicleType.replace('_', ' ')}</Chip>}
          </View>
        </Card.Content>
      </Card>

      {request.chat && (
        <Button
          mode="contained-tonal"
          icon="chat"
          style={styles.action}
          onPress={() =>
            navigation.navigate('ChatRoom', {
              chatId: request.chat!,
              requestId,
              title: other,
            })
          }
        >
          Message {other ?? ''}
        </Button>
      )}

      {request.status === 'matched' && (
        <Button
          mode="contained"
          icon="flag-checkered"
          style={styles.action}
          loading={complete.isPending}
          onPress={() => complete.mutate(requestId)}
        >
          Mark ride complete
        </Button>
      )}

      {request.status === 'completed' && ratingStatus?.canRate && (
        <Button
          mode="contained"
          icon="star"
          style={styles.action}
          onPress={() => navigation.navigate('RateJob', { requestId, rateeName: other })}
        >
          Rate {other ?? ''}
        </Button>
      )}

      {request.status === 'completed' && ratingStatus?.alreadyRated && (
        <Text variant="bodyMedium" style={styles.done}>
          Ride completed · you rated this trip ✓
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginTop: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { marginVertical: spacing.sm },
  dim: { opacity: 0.6 },
  gap: { marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  action: { borderRadius: 12 },
  done: { textAlign: 'center', opacity: 0.7, marginTop: spacing.sm },
});
