import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import {
  Text,
  Card,
  Chip,
  Switch,
  FAB,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VehiclesStackParamList } from '../../navigation/types';
import { useMyVehicles, useSetVehicleAvailability } from '../hooks/useVehicles';
import { EmptyState } from '../../common/components/EmptyState';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<VehiclesStackParamList, 'VehicleList'>;

export function VehicleListScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { data: vehicles, isLoading, isError, refetch, isRefetching } = useMyVehicles();
  const availability = useSetVehicleAvailability();

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
        data={vehicles ?? []}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="🚜"
            title={isError ? 'Could not load vehicles' : 'No vehicles yet'}
            subtitle={
              isError ? 'Pull to retry.' : 'Add your first vehicle to start receiving requests.'
            }
          />
        }
        renderItem={({ item }) => (
          <Card
            mode="outlined"
            style={styles.card}
            onPress={() => navigation.navigate('VehicleForm', { vehicleId: item.id })}
          >
            <Card.Title
              title={item.title}
              subtitle={item.registrationNumber}
              right={() => (
                <View style={styles.availability}>
                  <Text variant="labelSmall">{item.isAvailable ? 'Available' : 'Off'}</Text>
                  <Switch
                    value={item.isAvailable}
                    onValueChange={(val) =>
                      availability.mutate({ id: item.id, isAvailable: val })
                    }
                  />
                </View>
              )}
            />
            <Card.Content style={styles.chips}>
              <Chip compact>{item.type.replace('_', ' ')}</Chip>
              {item.verifiedRegistration ? (
                <Chip compact icon="check-decagram">
                  Verified
                </Chip>
              ) : (
                <Chip compact icon="clock-outline">
                  Pending docs
                </Chip>
              )}
            </Card.Content>
          </Card>
        )}
      />
      <FAB
        icon="plus"
        label="Add vehicle"
        style={styles.fab}
        onPress={() => navigation.navigate('VehicleForm', {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, flexGrow: 1 },
  card: { marginBottom: spacing.md },
  availability: { alignItems: 'center', marginRight: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md },
});
