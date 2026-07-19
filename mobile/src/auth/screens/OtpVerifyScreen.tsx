import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useVerifyOtp, useRequestOtp } from '../hooks/useAuth';
import { spacing } from '../../theme';
import { extractApiError } from '../../utils/errors';

const schema = z.object({ code: z.string().trim().regex(/^\d{4,8}$/, 'Enter the code') });
type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

export function OtpVerifyScreen({ route, navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { phone, devCode } = route.params;
  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: devCode ?? '' }, // dev: prefill the logged code
  });

  const onSubmit = handleSubmit(async ({ code }) => {
    const res = await verifyOtp.mutateAsync({ phone, code });
    // Existing users are logged in by the hook (RootNavigator swaps trees).
    // New users continue to role selection carrying the registration token.
    if (res.isNewUser && res.registrationToken) {
      navigation.navigate('RoleSelect', { registrationToken: res.registrationToken });
    }
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium">Verify your number</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Enter the code we sent to {phone}.
      </Text>

      {devCode ? (
        <Text variant="labelMedium" style={{ color: theme.colors.primary, marginBottom: 8 }}>
          Dev code: {devCode}
        </Text>
      ) : null}

      <Controller
        control={control}
        name="code"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Verification code"
            keyboardType="number-pad"
            autoFocus
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!formState.errors.code}
          />
        )}
      />
      <HelperText type="error" visible={!!formState.errors.code}>
        {formState.errors.code?.message}
      </HelperText>

      {verifyOtp.isError && (
        <HelperText type="error" visible>
          {extractApiError(verifyOtp.error)}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={verifyOtp.isPending}
        disabled={verifyOtp.isPending}
        style={styles.cta}
        contentStyle={styles.ctaContent}
      >
        Verify
      </Button>

      <Button
        mode="text"
        onPress={() => requestOtp.mutate(phone)}
        disabled={requestOtp.isPending}
        style={styles.resend}
      >
        Resend code
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg, opacity: 0.7 },
  input: { marginTop: spacing.sm },
  cta: { marginTop: spacing.md, borderRadius: 12 },
  ctaContent: { paddingVertical: spacing.sm },
  resend: { marginTop: spacing.sm },
});
