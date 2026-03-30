import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Chip,
  Switch,
  ActivityIndicator,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VEHICLE_TYPES, type VehicleType } from '../../types/domain';
import {
  useDriverProfile,
  useUpsertDriverProfile,
  useSetDriverAvailability,
} from '../hooks/useDriverProfile';
import { spacing } from '../../theme';
import { extractApiError } from '../../utils/errors';

const schema = z.object({
  licenseNumber: z.string().trim().min(3, 'Enter your licence number'),
  experienceYears: z.string().trim().regex(/^\d{1,2}$/, 'Enter years of experience'),
  bio: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

export function DriverProfileScreen(): React.JSX.Element {
  const theme = useTheme();
  const { data: profile, isLoading } = useDriverProfile();
  const upsert = useUpsertDriverProfile();
  const availability = useSetDriverAvailability();
  const [categories, setCategories] = React.useState<VehicleType[]>([]);
  const [saved, setSaved] = React.useState(false);

  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { licenseNumber: '', experienceYears: '', bio: '' },
  });

  // Hydrate the form once the profile loads.
  React.useEffect(() => {
    if (profile) {
      reset({
        licenseNumber: profile.licenseNumber,
        experienceYears: String(profile.experienceYears),
        bio: profile.bio ?? '',
      });
      setCategories(profile.vehicleCategories);
    }
  }, [profile, reset]);

  const toggleCategory = (t: VehicleType): void =>
    setCategories((prev) => (prev.includes(t) ? prev.filter((c) => c !== t) : [...prev, t]));

  const onSubmit = handleSubmit(async (values) => {
    if (categories.length === 0) return;
    await upsert.mutateAsync({
      licenseNumber: values.licenseNumber,
      experienceYears: Number(values.experienceYears),
      vehicleCategories: categories,
      bio: values.bio || undefined,
    });
    setSaved(true);
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {profile && (
        <View style={styles.availabilityRow}>
          <Text variant="titleMedium">Available for work</Text>
          <Switch
            value={profile.isAvailable}
            onValueChange={(v) => availability.mutate(v)}
          />
        </View>
      )}

      <Controller
        control={control}
        name="licenseNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Driving licence number"
            autoCapitalize="characters"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!formState.errors.licenseNumber}
          />
        )}
      />
      <HelperText type="error" visible={!!formState.errors.licenseNumber}>
        {formState.errors.licenseNumber?.message}
      </HelperText>

      <Controller
        control={control}
        name="experienceYears"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Years of experience"
            keyboardType="numeric"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!formState.errors.experienceYears}
          />
        )}
      />
      <HelperText type="error" visible={!!formState.errors.experienceYears}>
        {formState.errors.experienceYears?.message}
      </HelperText>

      <Text variant="labelLarge" style={styles.label}>
        Vehicles you can drive
      </Text>
      <View style={styles.chips}>
        {VEHICLE_TYPES.map((t) => (
          <Chip
            key={t}
            selected={categories.includes(t)}
            showSelectedOverlay
            onPress={() => toggleCategory(t)}
          >
            {t.replace('_', ' ')}
          </Chip>
        ))}
      </View>
      {categories.length === 0 && (
        <HelperText type="error" visible>
          Select at least one vehicle category
        </HelperText>
      )}

      <Controller
        control={control}
        name="bio"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="About you (optional)"
            multiline
            numberOfLines={3}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
          />
        )}
      />

      {upsert.isError && (
        <HelperText type="error" visible>
          {extractApiError(upsert.error)}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={upsert.isPending}
        disabled={upsert.isPending}
        style={styles.cta}
        contentStyle={styles.ctaContent}
      >
        Save profile
      </Button>

      <Snackbar visible={saved} onDismiss={() => setSaved(false)} duration={2000}>
        Profile saved
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: { marginTop: spacing.sm, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: { marginTop: spacing.xs },
  cta: { marginTop: spacing.lg, borderRadius: 12 },
  ctaContent: { paddingVertical: spacing.sm },
});
