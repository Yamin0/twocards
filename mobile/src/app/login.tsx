import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : error.message
      );
      setPassword('');
      setLoading(false);
    }
    // Succès : la session bascule le guard du Stack, pas de redirection manuelle
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <View style={styles.card}>
            <Text style={styles.wordmark}>
              twocards<Text style={styles.wordmarkDot}>.</Text>
            </Text>
            <Text style={styles.tagline}>CONNEXION À VOTRE ESPACE</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="nom@entreprise.com"
              placeholderTextColor="rgba(0,0,0,0.3)"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>MOT DE PASSE</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor="rgba(0,0,0,0.3)"
                secureTextEntry={!showPassword}
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                accessibilityLabel={
                  showPassword
                    ? 'Masquer le mot de passe'
                    : 'Afficher le mot de passe'
                }
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}>
                <Text style={styles.eyeText}>
                  {showPassword ? 'Masquer' : 'Afficher'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading || !email || !password}
              style={({ pressed }) => [
                styles.submit,
                (pressed || loading || !email || !password) && styles.submitDim,
              ]}>
              {loading && <ActivityIndicator size="small" color={Brand.ivory} />}
              <Text style={styles.submitText}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Text>
            </Pressable>

            <Text style={styles.footer}>
              Pas de compte ? Créez-le depuis le site twocards.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.ivory,
  },
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: Math.min(MaxContentWidth, 440),
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.five,
  },
  wordmark: {
    fontSize: 30,
    fontWeight: '500',
    letterSpacing: -0.5,
    textAlign: 'center',
    color: Brand.ink,
  },
  wordmarkDot: {
    color: Brand.mute,
  },
  tagline: {
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 3,
    textAlign: 'center',
    color: Brand.mute,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2,
    color: Brand.mute,
    marginBottom: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.ink,
    marginBottom: Spacing.four,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 80,
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.three,
    top: 13,
  },
  eyeText: {
    fontSize: 12,
    color: Brand.mute,
  },
  submit: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.ink,
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: Spacing.two,
  },
  submitDim: {
    opacity: 0.5,
  },
  submitText: {
    color: Brand.ivory,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: Spacing.four,
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(13,13,13,0.55)',
  },
});
