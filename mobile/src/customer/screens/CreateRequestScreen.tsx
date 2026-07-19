import React from 'react';
import { StyleSheet, ScrollView, View, Platform } from 'react-native';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerRequestsStackParamList } from '../../navigation/types';
import {
  VEHICLE_TYPES,
  SERVICE_TYPE_LABEL,
  type ServiceType,
  type VehicleType,
} from '../../types/domain';
import { LocationPicker } from '../../maps/components/LocationPicker';
import { RouteMap } from '../../maps/components/RouteMap';
import { AddressAutocomplete } from '../../maps/components/AddressAutocomplete';
import type { Coordinate } from '../../maps/services/geolocation';
import { useCurrentLocation } from '../../maps/hooks/useCurrentLocation';
import { useCreateRequest } from '../hooks/useRequests';
import { formatSchedule } from '../utils/requestDisplay';
import { extractApiError } from '../../utils/errors';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<CustomerRequestsStackParamList, 'CreateRequest'>;

interface PlaceState {
  address: string;
  coordinate: Coordinate | null;
  locating: boolean;
}

const SERVICE_TYPES: ServiceType[] = ['vehicle_only', 'driver_only', 'vehicle_and_driver'];
const emptyPlace = (): PlaceState => ({ address: '', coordinate: null, locating: false });

export function CreateRequestScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const create = useCreateRequest();
  const { coordinate: myLocation } = useCurrentLocation();

  const [serviceType, setServiceType] = React.useState<ServiceType>('vehicle_and_driver');
  const [vehicleType, setVehicleType] = React.useState<VehicleType>('tractor');
  const [pickup, setPickup] = React.useState<PlaceState>(emptyPlace);
  const [destination, setDestination] = React.useState<PlaceState>(emptyPlace);
  const [scheduledAt, setScheduledAt] = React.useState<Date>(
    () => new Date(Date.now() + 60 * 60 * 1000),
  );
  const [picker, setPicker] = React.useState<'date' | 'time' | null>(null);
  const [description, setDescription] = React.useState('');
  const [pickingOnMap, setPickingOnMap] = React.useState<null | 'pickup' | 'destination'>(null);
  const [submitted, setSubmitted] = React.useState(false);

  // Prefill pickup with the user's current location, cab-app style.
  React.useEffect(() => {
    if (myLocation && !pickup.coordinate) {
      setPickup({ address: 'My current location', coordinate: myLocation, locating: false });
    }
  }, [myLocation]);

  const needsVehicle = serviceType !== 'driver_only';
  const pickupValid = pickup.address.trim().length > 1 && pickup.coordinate;
  const destValid = destination.address.trim().length > 1 && destination.coordinate;
  const timeValid = scheduledAt.getTime() > Date.now() - 60 * 1000;
  const canSubmit = pickupValid && destValid && timeValid;

  const setPlace = (which: 'pickup' | 'destination', next: Partial<PlaceState>): void => {
    const setter = which === 'pickup' ? setPickup : setDestination;
    setter((prev) => ({ ...prev, ...next }));
  };

  const onDateTimeChange = (event: { type: string }, selected?: Date): void => {
    if (event.type === 'dismissed' || !selected) {
      setPicker(null);
      return;
    }
    const next = new Date(scheduledAt);
    if (picker === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setScheduledAt(next);
      setPicker('time'); // chain into time selection
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setScheduledAt(next);
      setPicker(null);
    }
  };

  const onSubmit = async (): Promise<void> => {
    setSubmitted(true);
    if (!canSubmit) return;
    await create.mutateAsync({
      pickup: {
        address: pickup.address.trim(),
        location: {
          type: 'Point',
          coordinates: [pickup.coordinate!.longitude, pickup.coordinate!.latitude],
        },
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
      scheduledAt: scheduledAt.toISOString(),
      description: description.trim() || undefined,
    });
    navigation.goBack();
  };

  const activePlace = pickingOnMap === 'pickup' ? pickup : destination;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Trip preview — pickup, destination and the route between them. */}
      <RouteMap pickup={pickup.coordinate} destination={destination.coordinate} />

      <AddressAutocomplete
        label="Pickup"
        address={pickup.address}
        hasCoordinate={Boolean(pickup.coordinate)}
        onSelect={(a, c) => setPlace('pickup', { address: a, coordinate: c })}
        onClear={(a) => setPlace('pickup', { address: a, coordinate: null })}
        onSetOnMap={() => setPickingOnMap('pickup')}
        error={submitted && !pickupValid}
      />
      <AddressAutocomplete
        label="Destination"
        address={destination.address}
        hasCoordinate={Boolean(destination.coordinate)}
        onSelect={(a, c) => setPlace('destination', { address: a, coordinate: c })}
        onClear={(a) => setPlace('destination', { address: a, coordinate: null })}
        onSetOnMap={() => setPickingOnMap('destination')}
        error={submitted && !destValid}
      />

      <Text variant="labelLarge" style={styles.label}>
        What do you need?
      </Text>
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

      <Text variant="labelLarge" style={styles.label}>
        When?
      </Text>
      <Button
        mode="outlined"
        icon="calendar-clock"
        style={styles.dateButton}
        contentStyle={styles.dateButtonContent}
        onPress={() => setPicker('date')}
      >
        {formatSchedule(scheduledAt.toISOString())}
      </Button>
      <HelperText type="error" visible={submitted && !timeValid}>
        Pick a time in the future
      </HelperText>
      {picker && (
        <DateTimePicker
          value={scheduledAt}
          mode={picker}
          is24Hour={false}
          minimumDate={picker === 'date' ? new Date() : undefined}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateTimeChange}
        />
      )}

      <TextInput
        mode="outlined"
        label="Description (optional)"
        placeholder="e.g. Need to move farming equipment"
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

      {/* Manual pin fallback (when geocoding isn't available). */}
      <Portal>
        <Modal
          visible={pickingOnMap !== null}
          onDismiss={() => setPickingOnMap(null)}
          contentContainerStyle={styles.mapModal}
        >
          <View style={styles.mapWrap}>
            <LocationPicker
              initial={activePlace.coordinate ?? undefined}
              onChange={(c) =>
                pickingOnMap && setPlace(pickingOnMap, { coordinate: c })
              }
            />
          </View>
          <Button mode="contained" style={styles.mapDone} onPress={() => setPickingOnMap(null)}>
            Use this location
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, flexGrow: 1, gap: spacing.xs },
  placeField: { marginTop: spacing.md },
  placeHelperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeHelper: { flexShrink: 1 },
  label: { marginTop: spacing.md, marginBottom: spacing.sm },
  segment: { marginTop: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateButton: { borderRadius: 12, alignSelf: 'flex-start' },
  dateButtonContent: { paddingVertical: spacing.xs },
  input: { marginTop: spacing.md },
  cta: { marginTop: spacing.lg, borderRadius: 12 },
  ctaContent: { paddingVertical: spacing.sm },
  mapModal: { flex: 1, margin: spacing.lg },
  mapWrap: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  mapDone: { marginTop: spacing.md, borderRadius: 12 },
});
