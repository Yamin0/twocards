import { Image } from 'expo-image'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import logo from '@/assets/images/logo.png'
import { Icon } from '@/components/venue/ui'
import { CardShadow, Light } from '@/constants/theme'
import { haptic } from '@/lib/haptics'
import { SITE_URL } from '@/lib/site'
import { supabase } from '@/lib/supabase'

/* Connexion : la même palette que le reste de l'app, deux champs, un
   bouton. Le mot de passe oublié se règle ici aussi, sans quitter l'app. */

type Mode = 'login' | 'forgot' | 'sent'

const ERRORS: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou mot de passe incorrect.',
  'Email not confirmed': "Confirmez d'abord votre e-mail : un lien vous a été envoyé à l'inscription.",
  'Too many requests': 'Trop de tentatives. Patientez une minute avant de réessayer.',
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = mode === 'login' ? isEmail(email) && password.length >= 6 : isEmail(email)

  const submit = async () => {
    if (!canSubmit || loading) return
    Keyboard.dismiss()
    setError('')
    setLoading(true)
    haptic.tap()

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${SITE_URL}/reset-password`,
      })
      setLoading(false)
      if (error) {
        haptic.error()
        setError(ERRORS[error.message] ?? "L'envoi a échoué. Vérifiez l'adresse et réessayez.")
        return
      }
      haptic.success()
      setMode('sent')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      haptic.error()
      setError(ERRORS[error.message] ?? 'Connexion impossible. Vérifiez votre réseau et réessayez.')
      setPassword('')
      setLoading(false)
      return
    }
    haptic.success()
    /* Succès : la session bascule le garde du Stack, pas de redirection ici. */
  }

  const switchMode = (next: Mode) => {
    setError('')
    setMode(next)
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Image source={logo} style={styles.logo} contentFit="contain" alt="twocards" />
            </View>
            <Text style={styles.wordmark}>twocards</Text>
            <Text style={styles.tagline}>Réservations, commissions et messages, entre deux services.</Text>
          </View>

          <View style={styles.card}>
            {mode === 'sent' ? (
              <View style={styles.sent}>
                <View style={styles.sentIcon}>
                  <Icon name="mail" size={22} color={Light.success} />
                </View>
                <Text style={styles.sentTitle}>Vérifiez votre boîte mail</Text>
                <Text style={styles.sentBody}>
                  Un lien pour choisir un nouveau mot de passe vient de partir à{' '}
                  <Text style={styles.sentEmail}>{email.trim()}</Text>. Il est valable une heure.
                </Text>
                <Pressable onPress={() => switchMode('login')} style={styles.submit}>
                  <Text style={styles.submitText}>Retour à la connexion</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.cardTitle}>{mode === 'login' ? 'Connexion' : 'Mot de passe oublié'}</Text>
                <Text style={styles.cardHint}>
                  {mode === 'login'
                    ? 'Votre compte twocards, le même que sur le site.'
                    : "Indiquez l'adresse du compte : vous recevrez un lien pour en choisir un nouveau."}
                </Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Icon name="alert-circle" size={16} color={Light.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputWrap}>
                  <Icon name="mail" size={17} color={Light.faint} />
                  <TextInput
                    style={styles.input}
                    placeholder="Adresse e-mail"
                    placeholderTextColor={Light.faint}
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    returnKeyType={mode === 'login' ? 'next' : 'send'}
                    onSubmitEditing={mode === 'login' ? undefined : submit}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {mode === 'login' && (
                  <View style={styles.inputWrap}>
                    <Icon name="lock" size={17} color={Light.faint} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mot de passe"
                      placeholderTextColor={Light.faint}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      textContentType="password"
                      returnKeyType="go"
                      onSubmitEditing={submit}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <Pressable
                      accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}>
                      <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={Light.muted} />
                    </Pressable>
                  </View>
                )}

                <Pressable
                  onPress={submit}
                  disabled={loading || !canSubmit}
                  style={({ pressed }) => [styles.submit, (loading || !canSubmit) && styles.submitDim, pressed && styles.pressed]}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>{mode === 'login' ? 'Se connecter' : 'Envoyer le lien'}</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => switchMode(mode === 'login' ? 'forgot' : 'login')}
                  hitSlop={8}
                  style={styles.link}>
                  <Text style={styles.linkText}>{mode === 'login' ? 'Mot de passe oublié ?' : 'Retour à la connexion'}</Text>
                </Pressable>
              </>
            )}
          </View>

          <Pressable onPress={() => Linking.openURL(`${SITE_URL}/signup`)} hitSlop={8} style={styles.footer}>
            <Text style={styles.footerText}>
              Pas encore de compte ? <Text style={styles.footerLink}>Inscrivez votre établissement</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Light.bg,
  },
  fill: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 24,
  },
  brand: {
    alignItems: 'center',
    gap: 8,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: Light.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...CardShadow,
  },
  logo: {
    width: 56,
    height: 56,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: Light.ink,
  },
  tagline: {
    fontSize: 13,
    lineHeight: 18,
    color: Light.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: Light.card,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    ...CardShadow,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Light.ink,
    letterSpacing: -0.3,
  },
  cardHint: {
    marginTop: -6,
    marginBottom: 4,
    fontSize: 13,
    lineHeight: 18,
    color: Light.muted,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Light.dangerSoft,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    flex: 1,
    color: Light.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Light.line,
    backgroundColor: Light.bg,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: Light.ink,
  },
  submit: {
    marginTop: 6,
    height: 50,
    borderRadius: 14,
    backgroundColor: Light.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDim: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  link: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Light.accent,
  },
  sent: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  sentIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Light.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Light.ink,
  },
  sentBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Light.muted,
    textAlign: 'center',
  },
  sentEmail: {
    fontWeight: '700',
    color: Light.ink,
  },
  footer: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 13,
    color: Light.muted,
    textAlign: 'center',
  },
  footerLink: {
    fontWeight: '600',
    color: Light.accent,
  },
})
