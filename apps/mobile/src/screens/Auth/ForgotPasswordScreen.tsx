import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { isValidEmail } from '@dydyd/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, typography, spacing, radii } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animated entrance for success state
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (sent) {
      Animated.parallel([
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(successScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sent, successOpacity, successScale]);

  const handleReset = async () => {
    setEmailError('');
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }

    setLoading(true);
    // Simulate network delay - TODO: Wire to backend POST /api/auth/forgot-password
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View
          style={[
            styles.successContent,
            {
              opacity: successOpacity,
              transform: [{ scale: successScale }],
            },
          ]}
        >
          <View
            style={[
              styles.checkCircle,
              {
                backgroundColor: colors.primary,
                borderRadius: radii.pill,
              },
            ]}
          >
            <Text style={styles.checkEmoji}>{'\u{2709}\u{FE0F}'}</Text>
          </View>
          <Text
            style={{
              fontSize: typography.sizeH2,
              fontWeight: typography.weightBold,
              color: colors.text,
              textAlign: 'center',
            }}
          >
            Check your email
          </Text>
          <Text
            style={{
              fontSize: typography.sizeBodySm,
              color: colors.textTertiary,
              textAlign: 'center',
              lineHeight: 22,
              marginTop: spacing.sm,
              paddingHorizontal: spacing.lg,
            }}
          >
            If an account exists for{' '}
            <Text style={{ color: colors.primary, fontWeight: typography.weightSemi }}>
              {email}
            </Text>
            , you'll receive a password reset link shortly.
          </Text>
          <Button
            title="Back to Login"
            onPress={() => navigation.goBack()}
            variant="primary"
            fullWidth
            style={{ marginTop: spacing['2xl'] }}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={{ marginBottom: spacing['2xl'] }}>
          <Text
            style={{
              fontSize: typography.sizeH2,
              fontWeight: typography.weightBold,
              color: colors.text,
            }}
          >
            Reset password
          </Text>
          <Text
            style={{
              fontSize: typography.sizeBody,
              color: colors.textTertiary,
              marginTop: spacing.sm,
              lineHeight: 24,
            }}
          >
            Enter the email associated with your account and we'll send you a reset link.
          </Text>
        </View>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError('');
          }}
          error={emailError}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />

        <Button
          title="Send Reset Link"
          onPress={handleReset}
          loading={loading}
          fullWidth
          style={{ marginTop: spacing.lg }}
        />

        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          fullWidth
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  content: {},
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  checkCircle: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkEmoji: {
    fontSize: 40,
  },
});
