import React from 'react';
import { View, FlatList, StyleSheet, Linking } from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Avatar,
  ActivityIndicator,
  Dialog,
  Portal,
  useTheme,
} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerRequestsStackParamList } from '../../navigation/types';
import { useRequestOffers, useAcceptOffer } from '../hooks/useOffers';
import type { OfferDetail } from '../../types/domain';
import { EmptyState } from '../../common/components/EmptyState';
import { extractApiError } from '../../utils/errors';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<CustomerRequestsStackParamList, 'OffersList'>;

export function OffersListScreen({ route, navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { requestId } = route.params;
  const { data: offers, isLoading, refetch, isRefetching } = useRequestOffers(requestId);
  const accept = useAcceptOffer(requestId);
  const [confirm, setConfirm] = React.useState<OfferDetail | null>(null);

  const onAccept = async (offer: OfferDetail): Promise<void> => {
    const result = await accept.mutateAsync(offer.id);
    setConfirm(null);
    // Straight to the trip map (route, details, actions) — Uber-style.
    navigation.getParent()?.navigate('Trip', { requestId: result.request.id });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={offers ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="🕑"
            title="No offers yet"
            subtitle="Nearby providers will send offers soon. Pull to refresh."
          />
        }
        renderItem={({ item }) => {
          const initials = item.provider.name.slice(0, 2).toUpperCase();
          return (
            <Card mode="outlined" style={styles.card}>
              <Card.Title
                title={item.provider.name}
                subtitle={`⭐ ${item.provider.rating.average.toFixed(1)} (${item.provider.rating.count})`}
                left={(p) =>
                  item.provider.avatarUrl ? (
                    <Avatar.Image {...p} source={{ uri: item.provider.avatarUrl }} />
                  ) : (
                    <Avatar.Text {...p} label={initials} />
                  )
                }
                right={() => (
                  <Text variant="titleLarge" style={styles.price}>
                    ₹{item.price}
                  </Text>
                )}
              />
              {(item.message || item.vehicle) && (
                <Card.Content style={styles.body}>
                  {item.vehicle && (
                    <Chip compact icon="truck">
                      {item.vehicle.title} · {item.vehicle.type.replace('_', ' ')}
                    </Chip>
                  )}
                  {item.message ? <Text variant="bodyMedium">{item.message}</Text> : null}
                </Card.Content>
              )}
              <Card.Actions>
                <Button icon="phone" onPress={() => Linking.openURL(`tel:${item.provider.phone}`)}>
                  Call
                </Button>
                {item.status === 'pending' ? (
                  <Button mode="contained" onPress={() => setConfirm(item)}>
                    Accept
                  </Button>
                ) : (
                  <Chip compact>{item.status}</Chip>
                )}
              </Card.Actions>
            </Card>
          );
        }}
      />

      <Portal>
        <Dialog visible={confirm !== null} onDismiss={() => setConfirm(null)}>
          <Dialog.Title>Accept this offer?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              You&apos;ll be connected with {confirm?.provider.name} for ₹{confirm?.price}. Other
              offers will be declined and a chat will open. You pay directly — the app doesn&apos;t
              handle payment.
            </Text>
            {accept.isError && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: spacing.sm }}>
                {extractApiError(accept.error)}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirm(null)}>Cancel</Button>
            <Button
              mode="contained"
              loading={accept.isPending}
              onPress={() => confirm && onAccept(confirm)}
            >
              Accept & chat
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, flexGrow: 1 },
  card: { marginBottom: spacing.md },
  price: { marginRight: spacing.md, fontWeight: '700' },
  body: { gap: spacing.sm, marginBottom: spacing.xs },
});
