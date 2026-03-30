import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, List, Button, Divider, useTheme } from 'react-native-paper';
import { useAppSelector } from '../../redux/store';
import { useLogout } from '../../auth/hooks/useAuth';
import { spacing } from '../../theme';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  vehicle_owner: 'Vehicle Owner',
  driver: 'Driver',
  admin: 'Admin',
};

export function ProfileScreen(): React.JSX.Element {
  const theme = useTheme();
  const { user, refreshToken } = useAppSelector((s) => s.auth);
  const logout = useLogout();

  if (!user) return <View style={styles.container} />;

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        {user.avatarUrl ? (
          <Avatar.Image size={72} source={{ uri: user.avatarUrl }} />
        ) : (
          <Avatar.Text size={72} label={initials} />
        )}
        <Text variant="headlineSmall" style={styles.name}>
          {user.name}
        </Text>
        <Text variant="bodyMedium" style={styles.meta}>
          {ROLE_LABEL[user.role]} · {user.phone}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          ⭐ {user.ratingSummary.average.toFixed(1)} ({user.ratingSummary.count})
        </Text>
      </View>

      <Divider />
      <List.Section>
        <List.Item title="Edit profile" left={(p) => <List.Icon {...p} icon="account-edit" />} />
        <List.Item title="Notifications" left={(p) => <List.Icon {...p} icon="bell-outline" />} />
        <List.Item title="Help & support" left={(p) => <List.Icon {...p} icon="help-circle-outline" />} />
      </List.Section>

      <Button
        mode="outlined"
        icon="logout"
        style={styles.logout}
        loading={logout.isPending}
        onPress={() => refreshToken && logout.mutate(refreshToken)}
      >
        Log out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  name: { marginTop: spacing.md },
  meta: { opacity: 0.7, marginTop: spacing.xs },
  logout: { margin: spacing.lg, borderRadius: 12 },
});
