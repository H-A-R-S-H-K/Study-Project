import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, Appbar, ActivityIndicator, Badge, useTheme } from 'react-native-paper';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from '../hooks/useNotifications';
import type { AppNotification, NotificationType } from '../../types/domain';
import { EmptyState } from '../../common/components/EmptyState';

const ICON: Record<NotificationType, string> = {
  new_nearby_request: 'map-marker-radius',
  new_offer: 'tag',
  offer_accepted: 'check-circle',
  new_message: 'message-text',
  booking_cancelled: 'cancel',
  ride_completed: 'flag-checkered',
  document_verified: 'file-check',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function NotificationsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { data: notifications, isLoading, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Content title="Notifications" />
        <Appbar.Action icon="check-all" onPress={() => markAll.mutate()} />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={notifications ?? []}
          keyExtractor={(n) => n.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="🔔" title="No notifications" subtitle="You're all caught up." />
          }
          renderItem={({ item }: { item: AppNotification }) => (
            <List.Item
              title={item.title}
              description={item.body}
              descriptionNumberOfLines={2}
              onPress={() => !item.isRead && markRead.mutate(item.id)}
              left={(p) => <List.Icon {...p} icon={ICON[item.type] ?? 'bell'} />}
              right={(p) => (
                <View {...p} style={styles.right}>
                  <List.Subheader style={styles.time}>{timeAgo(item.createdAt)}</List.Subheader>
                  {!item.isRead && <Badge size={10} style={styles.dot} />}
                </View>
              )}
              style={!item.isRead ? { backgroundColor: theme.colors.elevation.level1 } : undefined}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flexGrow: 1 },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  time: { fontSize: 11, opacity: 0.6, paddingRight: 0 },
  dot: { marginTop: 2 },
});
