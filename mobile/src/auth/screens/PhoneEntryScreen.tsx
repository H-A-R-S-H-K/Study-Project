import React from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useRequestOtp } from '../hooks/useAuth';
import { spacing } from '../../theme';
import { extractApiError } from '../../utils/errors';

const schema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Enter a valid phone number'),
});
type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneEntry'>;

export function PhoneEntryScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const requestOtp = useRequestOtp();
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '+91' },
  });

  const onSubmit = handleSubmit(async ({ phone }) => {
    const { devCode } = await requestOtp.mutateAsync(phone);
    navigation.navigate('OtpVerify', { phone, devCode });
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text variant="headlineMedium">Enter your phone</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        We&apos;ll send you a one-time code to verify it.
      </Text>

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Phone number"
            keyboardType="phone-pad"
            autoFocus
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!formState.errors.phone}
          />
        )}
      />
      <HelperText type="error" visible={!!formState.errors.phone}>
        {formState.errors.phone?.message}
      </HelperText>

      {requestOtp.isError && (
        <HelperText type="error" visible>
          {extractApiError(requestOtp.error)}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={requestOtp.isPending}
        disabled={requestOtp.isPending}
        style={styles.cta}
        contentStyle={styles.ctaContent}
      >
        Send code
      </Button>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg, opacity: 0.7 },
  input: { marginTop: spacing.sm },
  cta: { marginTop: spacing.md, borderRadius: 12 },
  ctaContent: { paddingVertical: spacing.sm },
});
