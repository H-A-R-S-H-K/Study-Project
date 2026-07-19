import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { TextInput, Text, Button, Divider, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  autocomplete,
  placeDetails,
  newSessionToken,
  type PlaceSuggestion,
} from '../services/places';
import type { Coordinate } from '../services/geolocation';
import { spacing } from '../../theme';

/**
 * Uber-style address entry: type to get live Places suggestions, tap one to set
 * the point. Falls back to "Set on map" when Places isn't available. Selecting a
 * suggestion reports both the tidy address and its coordinate to the parent.
 */
export function AddressAutocomplete({
  label,
  address,
  hasCoordinate,
  onSelect,
  onClear,
  onSetOnMap,
  error,
}: {
  label: string;
  address: string;
  hasCoordinate: boolean;
  onSelect: (address: string, coordinate: Coordinate) => void;
  onClear: (text: string) => void;
  onSetOnMap: () => void;
  error: boolean;
}): React.JSX.Element {
  const theme = useTheme();
  const [suggestions, setSuggestions] = React.useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const sessionRef = React.useRef(newSessionToken());
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChangeText = (text: string): void => {
    onClear(text); // typing invalidates any previously-set coordinate
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await autocomplete(text, sessionRef.current);
      setSuggestions(results);
      setLoading(false);
    }, 300);
  };

  const choose = async (s: PlaceSuggestion): Promise<void> => {
    setOpen(false);
    setSuggestions([]);
    setLoading(true);
    const details = await placeDetails(s.placeId, sessionRef.current);
    setLoading(false);
    sessionRef.current = newSessionToken(); // new session after a selection
    if (details) {
      onSelect(details.formattedAddress || `${s.mainText}, ${s.secondaryText}`, details.coordinate);
    }
  };

  return (
    <View style={styles.field}>
      <TextInput
        mode="outlined"
        label={`${label} address`}
        value={address}
        onChangeText={onChangeText}
        error={error}
        right={
          loading ? (
            <TextInput.Icon icon={() => <ActivityIndicator size={18} />} />
          ) : (
            <TextInput.Icon icon={hasCoordinate ? 'map-marker-check' : 'magnify'} />
          )
        }
      />

      {open && suggestions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: theme.colors.elevation.level2 }]}>
          {suggestions.map((s, i) => (
            <React.Fragment key={s.placeId}>
              {i > 0 && <Divider />}
              <Pressable
                style={styles.suggestion}
                android_ripple={{ color: theme.colors.surfaceVariant }}
                onPress={() => void choose(s)}
              >
                <Icon name="map-marker-outline" size={20} color={theme.colors.onSurfaceVariant} />
                <View style={styles.suggestionText}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {s.mainText}
                  </Text>
                  {s.secondaryText ? (
                    <Text variant="bodySmall" style={styles.secondary} numberOfLines={1}>
                      {s.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      )}

      <View style={styles.helperRow}>
        <Text variant="bodySmall" style={[styles.helper, error && { color: theme.colors.error }]}>
          {error
            ? 'Pick an address from suggestions, or set it on the map'
            : hasCoordinate
              ? 'Location set ✓'
              : 'Start typing to search…'}
        </Text>
        <Button compact onPress={onSetOnMap}>
          Set on map
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: spacing.md },
  dropdown: {
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    elevation: 3,
  },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  suggestionText: { flexShrink: 1 },
  secondary: { opacity: 0.7 },
  helperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  helper: { flexShrink: 1, opacity: 0.7, paddingLeft: spacing.sm },
});
