import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.hero}>
        <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
          Village Transport{'\n'}Connect
        </Text>
        <Text variant="bodyLarge" style={styles.tagline}>
          Find vehicles and drivers near you. Agree a price directly. No middleman.
        </Text>
      </View>
      <Button
        mode="contained"
        style={styles.cta}
        contentStyle={styles.ctaContent}
        onPress={() => navigation.navigate('PhoneEntry')}
      >
        Get started
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center' },
  tagline: { marginTop: spacing.md, opacity: 0.75 },
  cta: { borderRadius: 12 },
  ctaContent: { paddingVertical: spacing.sm },
});
