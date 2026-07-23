import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { sendSpriteMessage, clearMessages } from '../store/slices/spriteSlice';
import { SpriteMessage } from '../services/api/spriteService';
import { useTheme } from '../theme/ThemeProvider';

export const SpriteScreen: React.FC = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { messages, loading, error } = useSelector((s: RootState) => (s as any).sprite);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    dispatch(sendSpriteMessage(trimmed));
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    headerSubtitle: { fontSize: 12, color: colors.textSecondary },
    clearBtn: { padding: 8 },
    clearBtnText: { fontSize: 12, color: colors.primary },
    messages: { flex: 1, padding: 16 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
    bubble: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
      marginBottom: 8,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card ?? colors.border,
      borderBottomLeftRadius: 4,
    },
    userText: { color: '#fff', fontSize: 15, lineHeight: 22 },
    assistantText: { color: colors.text, fontSize: 15, lineHeight: 22 },
    timestamp: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
    typingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    typingDot: { color: colors.textSecondary, fontSize: 22, letterSpacing: 2 },
    errorText: { color: '#e53e3e', fontSize: 13, textAlign: 'center', marginBottom: 8 },
    inputRow: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'flex-end',
      gap: 8,
    },
    textInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 15,
      backgroundColor: colors.background,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: { color: '#fff', fontSize: 18 },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>✨ Your Sprite</Text>
          <Text style={styles.headerSubtitle}>Your fairy quest companion</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => dispatch(clearMessages())}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧚</Text>
            <Text style={styles.emptyText}>
              Hi, hero! I'm your Sprite.{'\n'}Ask me anything about your quests, streak, or habits.
            </Text>
          </View>
        ) : (
          messages.map((msg: SpriteMessage) => (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>
                {msg.content}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))
        )}

        {loading && (
          <View style={styles.typingRow}>
            <View style={[styles.bubble, styles.assistantBubble]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Talk to your Sprite..."
          placeholderTextColor={colors.textSecondary}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
