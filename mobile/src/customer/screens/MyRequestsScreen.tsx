import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import {
  Card,
  Chip,
  FAB,
  Text,
  ActivityIndicator,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerRequestsStackParamList } from '../../navigation/types';
import { useMyRequests } from '../hooks/useRequests';
import { STATUS_LABEL, STATUS_TONE, formatSchedule } from '../utils/requestDisplay';
import { SERVICE_TYPE_LABEL } from '../../types/domain';
import { EmptyState } from '../../common/components/EmptyState';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<CustomerRequestsStackParamList, 'MyRequests'>;

const toneColor = (
  tone: 'primary' | 'tertiary' | 'error' | 'muted',
  colors: MD3Theme['colors'],
): string =>
  tone === 'primary'
    ? colors.primary
    : tone === 'tertiary'
      ? colors.tertiary
      : tone === 'error'
        ? colors.error
        : colors.onSurfaceDisabled;

export function MyRequestsScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { data: requests, isLoading, refetch, isRefetching } = useMyRequests();

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
        data={requests ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="📝"
            title="No requests yet"
            subtitle="Post a request and nearby providers will send you offers."
          />
        }
        renderItem={({ item }) => (
          <Card
            mode="outlined"
            style={styles.card}
            onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
          >
            <Card.Title
              title={`${item.pickup.address} → ${item.destination.address}`}
              titleNumberOfLines={2}
              subtitle={`${SERVICE_TYPE_LABEL[item.serviceType]} · ${formatSchedule(item.scheduledAt)}`}
              subtitleNumberOfLines={2}
            />
            <Card.Content style={styles.meta}>
              <Chip
                compact
                textStyle={{ color: toneColor(STATUS_TONE[item.status], theme.colors) }}
              >
                {STATUS_LABEL[item.status]}
              </Chip>
              {item.status === 'open' && (
                <Text variant="labelMedium">
                  {item.offersCount} offer{item.offersCount === 1 ? '' : 's'}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
      />
      <FAB
        icon="plus"
        label="New request"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateRequest')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, flexGrow: 1 },
  card: { marginBottom: spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md },
});
