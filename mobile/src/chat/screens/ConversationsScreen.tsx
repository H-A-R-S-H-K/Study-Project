import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, Avatar, Badge, ActivityIndicator, useTheme } from 'react-native-paper';
import { useConversations } from '../hooks/useConversations';
import { EmptyState } from '../../common/components/EmptyState';

/**
 * The chat list, shared by customers and providers (the "other" party is
 * whichever side you aren't). Tapping a row opens the thread. Unread counts come
 * denormalised from the server and update live via conversation:updated.
 */
export function ConversationsScreen({
  navigation,
}: {
  navigation: { navigate: (screen: 'ChatRoom', params: { chatId: string; title: string }) => void };
}): React.JSX.Element {
  const theme = useTheme();
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={conversations ?? []}
        keyExtractor={(c) => c.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="No conversations yet"
            subtitle="When you accept an offer, a chat opens here."
          />
        }
        renderItem={({ item }) => {
          const initials = item.other.name.slice(0, 2).toUpperCase();
          return (
            <List.Item
              title={item.other.name}
              description={item.lastMessage ?? 'Say hello 👋'}
              descriptionNumberOfLines={1}
              onPress={() =>
                navigation.navigate('ChatRoom', { chatId: item.id, title: item.other.name })
              }
              left={(p) =>
                item.other.avatarUrl ? (
                  <Avatar.Image {...p} size={48} source={{ uri: item.other.avatarUrl }} />
                ) : (
                  <Avatar.Text {...p} size={48} label={initials} />
                )
              }
              right={(p) =>
                item.unread > 0 ? (
                  <Badge {...p} style={styles.badge}>
                    {item.unread}
                  </Badge>
                ) : null
              }
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flexGrow: 1 },
  badge: { alignSelf: 'center' },
});
