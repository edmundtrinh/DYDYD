import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register, selectAuthLoading, selectAuthError, clearError } from '../../store/slices/authSlice';
import { isValidEmail } from '@dydyd/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const getPasswordStrength = (pw: string): { label: string; color: string; score: number } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z\d]/.test(pw)) score++;

  if (score <= 1) return { label: 'Weak', color: '#DC2626', score };
  if (score <= 2) return { label: 'Fair', color: '#EA580C', score };
  if (score <= 3) return { label: 'Good', color: '#F5B400', score };
  return { label: 'Strong', color: '#2EA043', score };
};

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const serverError = useAppSelector(selectAuthError);
  const { colors, typography, spacing, radii } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = (): boolean => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    dispatch(clearError());

    if (!displayName.trim()) {
      setNameError('Display name is required');
      valid = false;
    } else if (displayName.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      valid = false;
    }

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await dispatch(
        register({ email: email.trim(), password, displayName: displayName.trim() }),
      ).unwrap();
    } catch {
      // Error is handled by Redux slice
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: spacing['2xl'] }}>
          <Text
            style={{
              fontSize: typography.sizeH1,
              fontWeight: typography.weightBold,
              color: colors.text,
            }}
          >
            Create your account
          </Text>
          <Text
            style={{
              fontSize: typography.sizeBody,
              color: colors.textTertiary,
              marginTop: spacing.sm,
            }}
          >
            Begin your adventure
          </Text>
        </View>

        {/* Server error banner */}
        {serverError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.redDim + '44',
                borderColor: colors.red,
                borderRadius: radii.sm,
                padding: spacing.md,
                marginBottom: spacing.base,
              },
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text style={{ color: colors.redBright, fontSize: typography.sizeBodySm }}>
              {serverError}
            </Text>
          </View>
        )}

        <View style={{ gap: spacing.base }}>
          <Input
            label="Display Name"
            placeholder="What should we call you?"
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (nameError) setNameError('');
            }}
            error={nameError}
            textContentType="name"
            autoComplete="name"
          />

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

          <View>
            <Input
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              secureTextEntry
              textContentType="newPassword"
            />
            {/* Password strength indicator */}
            {password.length > 0 && (
              <View
                style={[styles.strengthRow, { marginTop: spacing.sm }]}
                accessible
                accessibilityLabel={`Password strength: ${pwStrength.label}, ${pwStrength.score} of 4`}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 4, now: pwStrength.score }}
              >
                <View style={styles.strengthBars} importantForAccessibility="no-hide-descendants">
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            pwStrength.score >= i ? pwStrength.color : colors.surface3,
                          borderRadius: 2,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={{
                    color: pwStrength.color,
                    fontSize: typography.sizeMicro,
                    fontWeight: typography.weightSemi,
                    marginLeft: spacing.sm,
                  }}
                  importantForAccessibility="no"
                >
                  {pwStrength.label}
                </Text>
              </View>
            )}
          </View>

          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmError) setConfirmError('');
            }}
            error={confirmError}
            secureTextEntry
            textContentType="newPassword"
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <TouchableOpacity
          style={[styles.footer, { marginTop: spacing['2xl'] }]}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="link"
          accessibilityLabel="Already have an account? Log in"
        >
          <Text style={{ color: colors.textTertiary, fontSize: typography.sizeBodySm }}>
            {'Already have an account? '}
            <Text style={{ color: colors.primary, fontWeight: typography.weightSemi }}>
              Log in
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  errorBanner: {
    borderWidth: 1,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
});
