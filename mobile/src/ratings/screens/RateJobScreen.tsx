import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { StarRating } from '../../common/components/StarRating';
import { useRatingStatus, useSubmitRating } from '../hooks/useRatings';
import { EmptyState } from '../../common/components/EmptyState';
import { extractApiError } from '../../utils/errors';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RateJob'>;

export function RateJobScreen({ route, navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { requestId, rateeName } = route.params;
  const { data: status, isLoading } = useRatingStatus(requestId);
  const submit = useSubmitRating(requestId);
  const [score, setScore] = React.useState(0);
  const [review, setReview] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  const onSubmit = async (): Promise<void> => {
    setTouched(true);
    if (score < 1) return;
    await submit.mutateAsync({ score, review: review.trim() || undefined });
    navigation.goBack();
  };

  if (!isLoading && status && !status.canRate) {
    return (
      <EmptyState
        icon={status.alreadyRated ? '✅' : '⏳'}
        title={status.alreadyRated ? 'Already rated' : 'Not available'}
        subtitle={
          status.alreadyRated
            ? 'You have already rated this job.'
            : 'You can rate once the job is completed.'
        }
      />
    );
  }

  const name = status?.ratee?.name ?? rateeName ?? 'them';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>
        How was {name}?
      </Text>
      <View style={styles.stars}>
        <StarRating value={score} onChange={setScore} size={44} />
      </View>
      <HelperText type="error" visible={touched && score < 1} style={styles.center}>
        Tap a star to rate
      </HelperText>

      <TextInput
        mode="outlined"
        label="Add a review (optional)"
        multiline
        numberOfLines={4}
        value={review}
        onChangeText={setReview}
        style={styles.input}
      />

      {submit.isError && (
        <HelperText type="error" visible>
          {extractApiError(submit.error)}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={submit.isPending}
        disabled={submit.isPending}
        style={styles.cta}
        contentStyle={styles.ctaContent}
      >
        Submit rating
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  title: { textAlign: 'center', marginTop: spacing.lg },
  stars: { alignItems: 'center', marginTop: spacing.lg },
  center: { textAlign: 'center' },
  input: { marginTop: spacing.md },
  cta: { marginTop: spacing.lg, borderRadius: 12 },
  ctaContent: { paddingVertical: spacing.sm },
});
