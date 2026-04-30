import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, TextInput, Button, HelperText, Chip, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProviderFeedStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../redux/store';
import { useMyVehicles } from '../../vehicleOwner/hooks/useVehicles';
import { useCreateOffer } from '../hooks/useOffers';
import { extractApiError } from '../../utils/errors';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<ProviderFeedStackParamList, 'MakeOffer'>;

/**
 * Provider composes a priced offer. The price is a free numeric input — there is
 * NO suggestion, estimate, or calculation. Vehicle owners must pick one of their
 * vehicles matching the requested type; drivers just set a price + message.
 */
export function MakeOfferScreen({ route, navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { requestId, vehicleType } = route.params;
  const role = useAppSelector((s) => s.auth.user?.role);
  const isOwner = role === 'vehicle_owner';

  const { data: vehicles } = useMyVehicles();
  const eligibleVehicles = (vehicles ?? []).filter(
    (v) => v.isAvailable && (!vehicleType || v.type === vehicleType),
  );

  const [price, setPrice] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [vehicleId, setVehicleId] = React.useState<string | undefined>();
  const [touched, setTouched] = React.useState(false);
  const create = useCreateOffer(requestId);

  const priceNum = Number(price);
  const priceValid = price.trim() !== '' && Number.isFinite(priceNum) && priceNum >= 0;
  const vehicleValid = !isOwner || Boolean(vehicleId);
  const canSubmit = priceValid && vehicleValid;

  const onSubmit = async (): Promise<void> => {
    setTouched(true);
    if (!canSubmit) return;
    await create.mutateAsync({
      price: priceNum,
      message: message.trim() || undefined,
      vehicleId: isOwner ? vehicleId : undefined,
    });
    navigation.goBack();
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="bodyMedium" style={styles.note}>
        Enter the price you want. The customer will accept or decline — you settle payment
        directly, offline.
      </Text>

      <TextInput
        mode="outlined"
        label="Your price (₹)"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
        left={<TextInput.Affix text="₹" />}
        error={touched && !priceValid}
        style={styles.input}
      />
      <HelperText type="error" visible={touched && !priceValid}>
        Enter a valid price
      </HelperText>

      {isOwner && (
        <>
          <Text variant="labelLarge" style={styles.label}>
            Which vehicle?
          </Text>
          {eligibleVehicles.length === 0 ? (
            <HelperText type="error" visible>
              You have no available {vehicleType ?? ''} vehicle. Add or free one up first.
            </HelperText>
          ) : (
            <View style={styles.chips}>
              {eligibleVehicles.map((v) => (
                <Chip
                  key={v.id}
                  selected={vehicleId === v.id}
                  showSelectedOverlay
                  onPress={() => setVehicleId(v.id)}
                >
                  {v.title}
                </Chip>
              ))}
            </View>
          )}
          <HelperText type="error" visible={touched && !vehicleValid}>
            Select a vehicle
          </HelperText>
        </>
      )}

      <TextInput
        mode="outlined"
        label="Message (optional)"
        placeholder="e.g. I can reach within 20 minutes"
        multiline
        numberOfLines={3}
        value={message}
        onChangeText={setMessage}
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
        Send offer
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, flexGrow: 1 },
  note: { opacity: 0.7, marginBottom: spacing.md },
  label: { marginTop: spacing.sm, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: { marginTop: spacing.xs },
  cta: { marginTop: spacing.lg, borderRadius: 12 },
  ctaContent: { paddingVertical: spacing.sm },
});
