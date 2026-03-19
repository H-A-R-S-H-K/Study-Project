import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import type { UserRole } from '../../types/domain';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'RoleSelect'>;

const ROLES: { role: UserRole; title: string; description: string; icon: string }[] = [
  {
    role: 'customer',
    title: 'I need transport',
    description: 'Post requests and choose from providers near you.',
    icon: '🧑‍🌾',
  },
  {
    role: 'vehicle_owner',
    title: 'I own a vehicle',
    description: 'List your vehicles and send offers on nearby requests.',
    icon: '🚜',
  },
  {
    role: 'driver',
    title: 'I drive',
    description: "Offer your driving skills — no vehicle needed.",
    icon: '🧑‍✈️',
  },
];

export function RoleSelectScreen({ route, navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { registrationToken } = route.params;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium">How will you use the app?</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        You can add other roles later from your profile.
      </Text>

      {ROLES.map((r) => (
        <Card
          key={r.role}
          mode="outlined"
          style={styles.card}
          onPress={() =>
            navigation.navigate('ProfileSetup', { registrationToken, role: r.role })
          }
        >
          <Card.Title
            title={`${r.icon}  ${r.title}`}
            subtitle={r.description}
            subtitleNumberOfLines={2}
          />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg, opacity: 0.7 },
  card: { marginBottom: spacing.md },
});
