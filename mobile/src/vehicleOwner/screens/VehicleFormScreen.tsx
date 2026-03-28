import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, TextInput, Button, HelperText, Chip, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VehiclesStackParamList } from '../../navigation/types';
import { VEHICLE_TYPES, type VehicleType } from '../../types/domain';
import { useCreateVehicle, useMyVehicles, useUpdateVehicle } from '../hooks/useVehicles';
import { spacing } from '../../theme';
import { extractApiError } from '../../utils/errors';

const schema = z.object({
  title: z.string().trim().min(2, 'Enter a name'),
  registrationNumber: z.string().trim().min(3, 'Enter the registration number'),
  color: z.string().trim().optional(),
  capacity: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<VehiclesStackParamList, 'VehicleForm'>;

export function VehicleFormScreen({ route, navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { vehicleId } = route.params;
  const existing = useMyVehicles().data?.find((v) => v.id === vehicleId);
  const isEdit = Boolean(vehicleId);

  const [type, setType] = React.useState<VehicleType>(existing?.type ?? 'car');
  const create = useCreateVehicle();
  const update = useUpdateVehicle(vehicleId ?? '');
  const mutation = isEdit ? update : create;

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: existing?.title ?? '',
      registrationNumber: existing?.registrationNumber ?? '',
      color: existing?.color ?? '',
      capacity: existing?.capacity ? String(existing.capacity) : '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      type,
      title: values.title,
      registrationNumber: values.registrationNumber,
      color: values.color || undefined,
      capacity: values.capacity ? Number(values.capacity) : undefined,
    };
    if (isEdit) await update.mutateAsync(payload);
    else await create.mutateAsync(payload);
    navigation.goBack();
  });

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="labelLarge" style={styles.label}>
        Vehicle type
      </Text>
      <View style={styles.chips}>
        {VEHICLE_TYPES.map((t) => (
          <Chip key={t} selected={type === t} showSelectedOverlay onPress={() => setType(t)}>
            {t.replace('_', ' ')}
          </Chip>
        ))}
      </View>

      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Name / model (e.g. Mahindra 575)"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!formState.errors.title}
          />
        )}
      />
      <HelperText type="error" visible={!!formState.errors.title}>
        {formState.errors.title?.message}
      </HelperText>

      <Controller
        control={control}
        name="registrationNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Registration number"
            autoCapitalize="characters"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!formState.errors.registrationNumber}
          />
        )}
      />
      <HelperText type="error" visible={!!formState.errors.registrationNumber}>
        {formState.errors.registrationNumber?.message}
      </HelperText>

      <Controller
        control={control}
        name="color"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Colour (optional)"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
          />
        )}
      />

      <Controller
        control={control}
        name="capacity"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Capacity — seats or tonnage (optional)"
            keyboardType="numeric"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
          />
        )}
      />

      {mutation.isError && (
        <HelperText type="error" visible>
          {extractApiError(mutation.error)}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={mutation.isPending}
        disabled={mutation.isPending}
        style={styles.cta}
        contentStyle={styles.ctaContent}
      >
        {isEdit ? 'Save changes' : 'Add vehicle'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, flexGrow: 1 },
  label: { marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  input: { marginTop: spacing.xs },
  cta: { marginTop: spacing.lg, borderRadius: 12 },
  ctaContent: { paddingVertical: spacing.sm },
});
