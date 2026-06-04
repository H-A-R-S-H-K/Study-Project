import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, Avatar, ActivityIndicator, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { StarRating } from '../../common/components/StarRating';
import { useReceivedRatings } from '../hooks/useRatings';
import { EmptyState } from '../../common/components/EmptyState';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Ratings'>;

export function ReceivedRatingsScreen({ route }: Props): React.JSX.Element {
  const theme = useTheme();
  const { userId } = route.params;
  const { data: ratings, isLoading, refetch, isRefetching } = useReceivedRatings(userId);

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
        data={ratings ?? []}
        keyExtractor={(r) => r.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="⭐" title="No reviews yet" subtitle="Ratings appear here after jobs." />
        }
        renderItem={({ item }) => {
          const initials = item.rater.name.slice(0, 2).toUpperCase();
          return (
            <Card mode="outlined" style={styles.card}>
              <Card.Title
                title={item.rater.name}
                subtitle={new Date(item.createdAt).toLocaleDateString()}
                left={(p) =>
                  item.rater.avatarUrl ? (
                    <Avatar.Image {...p} source={{ uri: item.rater.avatarUrl }} />
                  ) : (
                    <Avatar.Text {...p} label={initials} />
                  )
                }
                right={() => (
                  <View style={styles.stars}>
                    <StarRating value={item.score} />
                  </View>
                )}
              />
              {item.review ? (
                <Card.Content>
                  <Text variant="bodyMedium">{item.review}</Text>
                </Card.Content>
              ) : null}
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, flexGrow: 1 },
  card: { marginBottom: spacing.md },
  stars: { marginRight: spacing.md },
});
