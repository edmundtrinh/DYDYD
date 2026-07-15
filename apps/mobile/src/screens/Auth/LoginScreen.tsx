import React, { useState } from 'react';
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
import { login, selectAuthLoading, selectAuthError, clearError } from '../../store/slices/authSlice';
import { isValidEmail } from '@dydyd/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const serverError = useAppSelector(selectAuthError);
  const { colors, typography, spacing } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    dispatch(clearError());

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
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await dispatch(login({ email: email.trim(), password })).unwrap();
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
            Welcome back
          </Text>
          <Text
            style={{
              fontSize: typography.sizeBody,
              color: colors.textTertiary,
              marginTop: spacing.sm,
            }}
          >
            Your quests await, Adventurer
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
                borderRadius: spacing.sm,
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

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            error={passwordError}
            secureTextEntry
            textContentType="password"
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={{ alignSelf: 'flex-end' }}
            accessibilityRole="link"
            accessibilityLabel="Forgot password?"
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.sizeBodySm,
                fontWeight: typography.weightMedium,
              }}
            >
              Forgot password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <TouchableOpacity
          style={[styles.footer, { marginTop: spacing['2xl'] }]}
          onPress={() => navigation.navigate('Register')}
          accessibilityRole="link"
          accessibilityLabel="Don't have an account? Sign up"
        >
          <Text style={{ color: colors.textTertiary, fontSize: typography.sizeBodySm }}>
            {"Don't have an account? "}
            <Text style={{ color: colors.primary, fontWeight: typography.weightSemi }}>
              Sign up
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
  footer: {
    alignItems: 'center',
  },
});
