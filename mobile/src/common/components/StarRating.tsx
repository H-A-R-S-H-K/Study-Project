import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Star rating used both as a read-only display and an editable input. When
 * `onChange` is provided the stars become tappable.
 */
export function StarRating({
  value,
  onChange,
  size = 20,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}): React.JSX.Element {
  const theme = useTheme();
  const editable = Boolean(onChange);

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const name = value >= star ? 'star' : value >= star - 0.5 ? 'star-half-full' : 'star-outline';
        const icon = <Icon name={name} size={size} color={theme.colors.tertiary} />;
        return editable ? (
          <Pressable key={star} onPress={() => onChange?.(star)} hitSlop={6} style={styles.star}>
            {icon}
          </Pressable>
        ) : (
          <View key={star} style={styles.star}>
            {icon}
          </View>
        );
      })}
    </View>
  );
}

/** Compact "4.6 (12)" summary with a single star. */
export function RatingSummaryLabel({
  average,
  count,
}: {
  average: number;
  count: number;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Icon name="star" size={14} color={theme.colors.tertiary} />
      <Text variant="labelMedium" style={styles.summary}>
        {count > 0 ? `${average.toFixed(1)} (${count})` : 'No ratings yet'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { paddingHorizontal: 2 },
  summary: { marginLeft: 4 },
});
