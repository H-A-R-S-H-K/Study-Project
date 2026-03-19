import React from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useRegister } from '../hooks/useAuth';
import { spacing } from '../../theme';
import { extractApiError } from '../../utils/errors';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')).optional(),
  homeAddress: z.string().trim().max(300).optional(),
});
type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'ProfileSetup'>;

export function ProfileSetupScreen({ route }: Props): React.JSX.Element {
  const theme = useTheme();
  const { registrationToken, role } = route.params;
  const register = useRegister();
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', homeAddress: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    // On success the hook stores credentials and RootNavigator swaps to the app.
    await register.mutateAsync({
      registrationToken,
      role,
      name: values.name,
      email: values.email || undefined,
      homeAddress: values.homeAddress || undefined,
    });
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text variant="headlineMedium">Complete your profile</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Just a few details to get you started.
        </Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              mode="outlined"
              label="Full name"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              style={styles.input}
              error={!!formState.errors.name}
            />
          )}
        />
        <HelperText type="error" visible={!!formState.errors.name}>
          {formState.errors.name?.message}
        </HelperText>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              mode="outlined"
              label="Email (optional)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              style={styles.input}
              error={!!formState.errors.email}
            />
          )}
        />

        <Controller
          control={control}
          name="homeAddress"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              mode="outlined"
              label="Village / area (optional)"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              style={styles.input}
            />
          )}
        />

        {register.isError && (
          <HelperText type="error" visible>
            {extractApiError(register.error)}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={onSubmit}
          loading={register.isPending}
          disabled={register.isPending}
          style={styles.cta}
          contentStyle={styles.ctaContent}
        >
          Create account
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, flexGrow: 1 },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.md, opacity: 0.7 },
  input: { marginTop: spacing.sm },
  cta: { marginTop: spacing.lg, borderRadius: 12 },
  ctaContent: { paddingVertical: spacing.sm },
});
