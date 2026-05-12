import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, IconButton, ActivityIndicator, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useChatRoom } from '../hooks/useChatRoom';
import { useAppSelector } from '../../redux/store';
import type { ChatMessage } from '../../types/domain';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

export function ChatRoomScreen({ route }: Props): React.JSX.Element {
  const theme = useTheme();
  const { chatId } = route.params;
  const myId = useAppSelector((s) => s.auth.user?.id);
  const { messages, loading, otherTyping, send, setTyping } = useChatRoom(chatId);
  const [draft, setDraft] = React.useState('');
  const listRef = React.useRef<FlatList<ChatMessage>>(null);

  React.useEffect(() => {
    // Keep the newest message in view as the thread grows.
    if (messages.length) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const onSend = (): void => {
    if (!draft.trim()) return;
    send(draft);
    setDraft('');
    setTyping(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <MessageBubble message={item} mine={item.sender === myId} />
        )}
      />

      {otherTyping && (
        <Text variant="labelSmall" style={styles.typing}>
          typing…
        </Text>
      )}

      <View style={[styles.inputRow, { borderTopColor: theme.colors.outlineVariant }]}>
        <TextInput
          mode="outlined"
          placeholder="Message"
          value={draft}
          onChangeText={(t) => {
            setDraft(t);
            setTyping(t.length > 0);
          }}
          style={styles.input}
          dense
          multiline
        />
        <IconButton icon="send" mode="contained" onPress={onSend} disabled={!draft.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  mine,
}: {
  message: ChatMessage;
  mine: boolean;
}): React.JSX.Element {
  const theme = useTheme();
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const read = mine && message.readBy.length > 1;

  return (
    <View
      style={[
        styles.bubble,
        mine
          ? { alignSelf: 'flex-end', backgroundColor: theme.colors.primaryContainer }
          : { alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      {message.type === 'location' ? (
        <Text variant="bodyMedium">📍 Shared a location</Text>
      ) : message.type === 'image' ? (
        <Text variant="bodyMedium">📷 Photo</Text>
      ) : (
        <Text variant="bodyMedium">{message.text}</Text>
      )}
      <Text variant="labelSmall" style={styles.meta}>
        {time}
        {mine ? (read ? ' · Read' : ' · Sent') : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, gap: spacing.sm },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: spacing.sm, paddingHorizontal: spacing.md },
  meta: { opacity: 0.6, marginTop: 2, alignSelf: 'flex-end' },
  typing: { marginLeft: spacing.md, marginBottom: spacing.xs, opacity: 0.6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, maxHeight: 120 },
});
