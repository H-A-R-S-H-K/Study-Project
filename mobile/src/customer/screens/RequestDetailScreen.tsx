import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Divider,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerRequestsStackParamList } from '../../navigation/types';
import { useRequest, useCancelRequest } from '../hooks/useRequests';
import { STATUS_LABEL, formatSchedule } from '../utils/requestDisplay';
import { SERVICE_TYPE_LABEL } from '../../types/domain';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<CustomerRequestsStackParamList, 'RequestDetail'>;

export function RequestDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { requestId } = route.params;
  const { data: request, isLoading } = useRequest(requestId);
  const cancel = useCancelRequest();

  if (isLoading || !request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const canCancel = request.status === 'open' || request.status === 'matched';

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.headerRow}>
        <Chip>{STATUS_LABEL[request.status]}</Chip>
        <Text variant="labelLarge">{SERVICE_TYPE_LABEL[request.serviceType]}</Text>
      </View>

      <Card mode="outlined" style={styles.card}>
        <Card.Content>
          <Text variant="labelSmall" style={styles.dim}>
            PICKUP
          </Text>
          <Text variant="bodyLarge">{request.pickup.address}</Text>
          <Divider style={styles.divider} />
          <Text variant="labelSmall" style={styles.dim}>
            DESTINATION
          </Text>
          <Text variant="bodyLarge">{request.destination.address}</Text>
        </Card.Content>
      </Card>

      <Card mode="outlined" style={styles.card}>
        <Card.Content>
          <Row label="When" value={formatSchedule(request.scheduledAt)} />
          {request.vehicleType && <Row label="Vehicle" value={request.vehicleType.replace('_', ' ')} />}
          <Row label="Offers" value={String(request.offersCount)} />
          {request.description ? <Row label="Notes" value={request.description} /> : null}
        </Card.Content>
      </Card>

      {request.status === 'open' && (
        <Button
          mode="contained-tonal"
          icon="tag-multiple"
          style={styles.action}
          onPress={() => navigation.navigate('OffersList', { requestId: request.id })}
        >
          View offers ({request.offersCount})
        </Button>
      )}

      {canCancel && (
        <Button
          mode="outlined"
          textColor={theme.colors.error}
          style={styles.action}
          loading={cancel.isPending}
          onPress={async () => {
            await cancel.mutateAsync({ id: request.id });
            navigation.goBack();
          }}
        >
          Cancel request
        </Button>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text variant="bodyMedium" style={styles.dim}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  card: { marginBottom: spacing.md },
  divider: { marginVertical: spacing.sm },
  dim: { opacity: 0.6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  rowValue: { flexShrink: 1, textAlign: 'right', marginLeft: spacing.md },
  action: { marginTop: spacing.sm, borderRadius: 12 },
});
