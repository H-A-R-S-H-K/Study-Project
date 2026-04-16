import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Chip,
  SegmentedButtons,
  HelperText,
  Portal,
  Modal,
  useTheme,
} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerRequestsStackParamList } from '../../navigation/types';
import {
  VEHICLE_TYPES,
  SERVICE_TYPE_LABEL,
  type ServiceType,
  type VehicleType,
} from '../../types/domain';
import { LocationPicker } from '../../maps/components/LocationPicker';
import type { Coordinate } from '../../maps/services/geolocation';
import { useCreateRequest } from '../hooks/useRequests';
import { SCHEDULE_PRESETS } from '../utils/requestDisplay';
import { extractApiError } from '../../utils/errors';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<CustomerRequestsStackParamList, 'CreateRequest'>;

interface PlaceState {
  address: string;
  coordinate: Coordinate | null;
}

const SERVICE_TYPES: ServiceType[] = ['vehicle_only', 'driver_only', 'vehicle_and_driver'];

export function CreateRequestScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const create = useCreateRequest();

  const [serviceType, setServiceType] = React.useState<ServiceType>('vehicle_and_driver');
  const [vehicleType, setVehicleType] = React.useState<VehicleType>('tractor');
  const [pickup, setPickup] = React.useState<PlaceState>({ address: '', coordinate: null });
  const [destination, setDestination] = React.useState<PlaceState>({ address: '', coordinate: null });
  const [scheduleKey, setScheduleKey] = React.useState(SCHEDULE_PRESETS[2].key);
  const [description, setDescription] = React.useState('');
  const [picking, setPicking] = React.useState<null | 'pickup' | 'destination'>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const needsVehicle = serviceType !== 'driver_only';
  const pickupValid = pickup.address.trim().length > 1 && pickup.coordinate;
  const destValid = destination.address.trim().length > 1 && destination.coordinate;
  const canSubmit = pickupValid && destValid;

  const onSubmit = async (): Promise<void> => {
    setSubmitted(true);
    if (!canSubmit) return;
    const preset = SCHEDULE_PRESETS.find((p) => p.key === scheduleKey)!;
    await create.mutateAsync({
      pickup: {
        address: pickup.address.trim(),
        location: { type: 'Point', coordinates: [pickup.coordinate!.longitude, pickup.coordinate!.latitude] },
      },
      destination: {
        address: destination.address.trim(),
        location: {
          type: 'Point',
          coordinates: [destination.coordinate!.longitude, destination.coordinate!.latitude],
        },
      },
      serviceType,
      vehicleType: needsVehicle ? vehicleType : undefined,
      scheduledAt: preset.toISO(),
      description: description.trim() || undefined,
    });
    navigation.goBack();
  };

  const activePlace = picking === 'pickup' ? pickup : destination;
  const setActivePlace = picking === 'pickup' ? setPickup : setDestination;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="labelLarge">What do you need?</Text>
      <SegmentedButtons
        style={styles.segment}
        value={serviceType}
        onValueChange={(v) => setServiceType(v as ServiceType)}
        buttons={SERVICE_TYPES.map((s) => ({ value: s, label: SERVICE_TYPE_LABEL[s] }))}
      />

      {needsVehicle && (
        <>
          <Text variant="labelLarge" style={styles.label}>
            Vehicle type
          </Text>
          <View style={styles.chips}>
            {VEHICLE_TYPES.map((t) => (
              <Chip key={t} selected={vehicleType === t} showSelectedOverlay onPress={() => setVehicleType(t)}>
                {t.replace('_', ' ')}
              </Chip>
            ))}
          </View>
        </>
      )}

      <PlaceField
        title="Pickup"
        place={pickup}
        onAddress={(a) => setPickup((p) => ({ ...p, address: a }))}
        onPick={() => setPicking('pickup')}
        error={submitted && !pickupValid}
      />
      <PlaceField
        title="Destination"
        place={destination}
        onAddress={(a) => setDestination((p) => ({ ...p, address: a }))}
        onPick={() => setPicking('destination')}
        error={submitted && !destValid}
      />

      <Text variant="labelLarge" style={styles.label}>
        When?
      </Text>
      <View style={styles.chips}>
        {SCHEDULE_PRESETS.map((p) => (
          <Chip key={p.key} selected={scheduleKey === p.key} showSelectedOverlay onPress={() => setScheduleKey(p.key)}>
            {p.label}
          </Chip>
        ))}
      </View>

      <TextInput
        mode="outlined"
        label="Description (optional)"
        multiline
        numberOfLines={3}
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />

      {create.isError && (
        <HelperText type="error" visible>
          {extractApiError(create.error)}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={create.isPending}
        disabled={create.isPending}
        style={styles.cta}
        contentStyle={styles.ctaContent}
      >
        Post request
      </Button>

      <Portal>
        <Modal
          visible={picking !== null}
          onDismiss={() => setPicking(null)}
          contentContainerStyle={styles.mapModal}
        >
          <View style={styles.mapWrap}>
            <LocationPicker
              initial={activePlace.coordinate ?? undefined}
              onChange={(c) => setActivePlace((p) => ({ ...p, coordinate: c }))}
            />
          </View>
          <Button mode="contained" style={styles.mapDone} onPress={() => setPicking(null)}>
            Use this location
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

function PlaceField({
  title,
  place,
  onAddress,
  onPick,
  error,
}: {
  title: string;
  place: PlaceState;
  onAddress: (a: string) => void;
  onPick: () => void;
  error: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.placeField}>
      <TextInput
        mode="outlined"
        label={`${title} address`}
        value={place.address}
        onChangeText={onAddress}
        error={error}
        right={
          <TextInput.Icon
            icon={place.coordinate ? 'map-marker-check' : 'map-marker-plus'}
            onPress={onPick}
          />
        }
      />
      <HelperText type={error ? 'error' : 'info'} visible>
        {error
          ? 'Enter an address and set the point on the map'
          : place.coordinate
            ? 'Location set ✓'
            : 'Tap the pin to set the point on the map'}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, flexGrow: 1 },
  segment: { marginTop: spacing.sm },
  label: { marginTop: spacing.md, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  placeField: { marginTop: spacing.md },
  input: { marginTop: spacing.md },
  cta: { marginTop: spacing.lg, borderRadius: 12 },
  ctaContent: { paddingVertical: spacing.sm },
  mapModal: { flex: 1, margin: spacing.lg },
  mapWrap: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  mapDone: { marginTop: spacing.md, borderRadius: 12 },
});
