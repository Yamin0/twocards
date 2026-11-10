import Constants from 'expo-constants'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { Avatar, Button, Card, Field, Icon, ListRow, Segmented, StackScreen, inputStyle } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { haptic } from '@/lib/haptics'
import { useLocaleChoice, useT, withLang, type Locale } from '@/lib/i18n'
import { pushStatus, registerPush, type PushStatus } from '@/lib/push'
import { signOut as signOutEverywhere } from '@/lib/sign-out'
import { getRoleLabels, SITE_URL } from '@/lib/site'
import { useToast } from '@/lib/toast'
import { updateAvatar, updatePassword, updateProfile } from '@/lib/venue-data'

/* Profil et paramètres : la photo, les quatre champs qui comptent, le mot
   de passe, les notifications, la déconnexion. */

const CONTACT_EMAIL = 'contact@twocardspro.com'

export default function SettingsScreen() {
  const { session, role, tabRole, fullName, venueName, avatarUrl } = useAuth()
  const toast = useToast()
  const t = useT()
  const { locale, setLocale } = useLocaleChoice()
  const userId = session?.user.id ?? null
  const email = session?.user.email ?? '—'
  const meta = session?.user.user_metadata ?? {}
  const version = Constants.expoConfig?.version ?? '1.0.0'

  const [form, setForm] = useState({
    full_name: fullName ?? '',
    venue_name: venueName ?? '',
    city: (meta.city as string | undefined) ?? '',
    phone: (meta.phone as string | undefined) ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [push, setPush] = useState<PushStatus | null>(null)
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    let cancelled = false
    pushStatus()
      .then((s) => {
        if (!cancelled) setPush(s)
      })
      .catch(() => {
        if (!cancelled) setPush('unsupported')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const dirty =
    form.full_name !== (fullName ?? '') ||
    form.venue_name !== (venueName ?? '') ||
    form.city !== ((meta.city as string | undefined) ?? '') ||
    form.phone !== ((meta.phone as string | undefined) ?? '')

  const save = useCallback(async () => {
    if (!userId) return
    setSaving(true)
    haptic.tap()
    const ok = await updateProfile(userId, {
      full_name: form.full_name.trim(),
      venue_name: form.venue_name.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
    })
    setSaving(false)
    if (ok) {
      haptic.success()
      toast.show({ message: t('Profil enregistré', 'Profile saved'), tone: 'success' })
    } else {
      haptic.error()
      toast.show({ message: t('Enregistrement impossible. Vérifiez votre connexion.', "Couldn't save. Check your connection."), tone: 'danger' })
    }
  }, [userId, form, toast, t])

  const changePhoto = async () => {
    if (!userId || uploading) return
    setUploading(true)
    try {
      const url = await updateAvatar(userId)
      if (url === null) toast.show({ message: t('Photo non enregistrée. Réessayez.', 'Photo not saved. Please try again.'), tone: 'danger' })
      else if (url) {
        haptic.success()
        toast.show({ message: t('Photo mise à jour', 'Photo updated'), tone: 'success' })
      }
    } catch {
      toast.show({ message: t("Envoi de la photo impossible.", "Couldn't upload the photo."), tone: 'danger' })
    } finally {
      setUploading(false)
    }
  }

  const changePassword = async () => {
    if (pw.next.length < 8) {
      setPwError(t('Huit caractères minimum.', 'At least eight characters.'))
      return
    }
    if (pw.next !== pw.confirm) {
      setPwError(t('Les deux saisies ne correspondent pas.', "The two entries don't match."))
      return
    }
    setPwSaving(true)
    setPwError('')
    haptic.tap()
    const err = await updatePassword(pw.next, t)
    setPwSaving(false)
    if (err) {
      haptic.error()
      setPwError(err)
      return
    }
    haptic.success()
    setPw({ next: '', confirm: '' })
    toast.show({ message: t('Mot de passe changé', 'Password changed'), tone: 'success' })
  }

  const togglePush = useCallback(async () => {
    if (!userId || push === 'granted' || push === 'unsupported') return
    if (push === 'denied') {
      Linking.openSettings()
      return
    }
    setPush(await registerPush(userId))
  }, [userId, push])

  const signOut = () =>
    Alert.alert(t('Se déconnecter ?', 'Log out?'), t('Vous ne recevrez plus de notifications sur ce téléphone.', "You'll stop receiving notifications on this phone."), [
      { text: t('Rester', 'Stay'), style: 'cancel' },
      {
        text: t('Se déconnecter', 'Log out'),
        style: 'destructive',
        onPress: () => {
          void signOutEverywhere()
        },
      },
    ])

  const requestDeletion = () => {
    const subject = encodeURIComponent(t('Suppression de mon compte twocards', 'Delete my twocards account'))
    const body = encodeURIComponent(
      t(
        `Bonjour,\n\nJe demande la suppression de mon compte twocards et des données associées.\n\nCompte : ${email}\n\nMerci.`,
        `Hello,\n\nI would like my twocards account and all associated data to be deleted.\n\nAccount: ${email}\n\nThank you.`
      )
    )
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`).catch(() =>
      Alert.alert(
        t('Aucune application de messagerie', 'No email app'),
        t(`Écrivez à ${CONTACT_EMAIL} depuis votre adresse ${email}.`, `Write to ${CONTACT_EMAIL} from your address ${email}.`)
      )
    )
  }

  const pushLabel: Record<PushStatus, string> = {
    granted: t('Activées sur ce téléphone', 'On for this phone'),
    denied: t('Refusées, toucher pour ouvrir les réglages', 'Blocked, tap to open Settings'),
    undetermined: t('Toucher pour activer', 'Tap to turn on'),
    unsupported: t('Indisponibles sur cet appareil', 'Not available on this device'),
  }

  return (
    <StackScreen title={t('Paramètres', 'Settings')}>
      <Card style={styles.head}>
        <Pressable onPress={changePhoto} style={styles.avatarWrap} accessibilityLabel={t('Changer la photo', 'Change photo')}>
          <Avatar name={form.full_name || form.venue_name || 'T'} size={64} uri={avatarUrl} />
          <View style={styles.avatarBadge}>
            {uploading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="camera" size={12} color="#FFFFFF" />}
          </View>
        </Pressable>
        <View style={styles.headText}>
          <Text style={styles.headName} numberOfLines={1}>
            {form.venue_name || t('Votre établissement', 'Your venue')}
          </Text>
          <Text style={styles.headHint} numberOfLines={1}>
            {tabRole === 'activite' ? t('Activités & services', 'Activities & services') : getRoleLabels(t)[role]} · {email}
          </Text>
          <Pressable onPress={changePhoto} hitSlop={6}>
            <Text style={styles.headLink}>{avatarUrl ? t('Changer la photo', 'Change photo') : t('Ajouter une photo ou un logo', 'Add a photo or logo')}</Text>
          </Pressable>
        </View>
      </Card>

      <Text style={styles.heading}>{t('Établissement', 'Venue')}</Text>
      <Card style={styles.form}>
        <Field label={t('Nom du responsable', 'Manager name')}>
          <TextInput
            value={form.full_name}
            onChangeText={(v) => setForm({ ...form, full_name: v })}
            style={inputStyle}
            placeholder={t('Prénom Nom', 'First Last')}
            placeholderTextColor={Light.faint}
            autoCapitalize="words"
            textContentType="name"
          />
        </Field>
        <Field label={t('Établissement', 'Venue')}>
          <TextInput
            value={form.venue_name}
            onChangeText={(v) => setForm({ ...form, venue_name: v })}
            style={inputStyle}
            placeholder={t('Nom affiché aux hôtels', 'Name shown to hotels')}
            placeholderTextColor={Light.faint}
          />
        </Field>
        <View style={styles.twoCols}>
          <View style={styles.col}>
            <Field label={t('Ville', 'City')}>
              <TextInput
                value={form.city}
                onChangeText={(v) => setForm({ ...form, city: v })}
                style={inputStyle}
                placeholder="Marrakech"
                placeholderTextColor={Light.faint}
                autoCapitalize="words"
              />
            </Field>
          </View>
          <View style={styles.col}>
            <Field label={t('Téléphone', 'Phone')}>
              <TextInput
                value={form.phone}
                onChangeText={(v) => setForm({ ...form, phone: v })}
                style={inputStyle}
                placeholder="+212 6 …"
                placeholderTextColor={Light.faint}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
              />
            </Field>
          </View>
        </View>
        <Button label={saving ? t('Enregistrement…', 'Saving…') : t('Enregistrer', 'Save')} onPress={save} disabled={!dirty || saving} />
      </Card>

      <Text style={styles.heading}>{t('Sécurité', 'Security')}</Text>
      <Card style={styles.form}>
        <Field label={t('Nouveau mot de passe', 'New password')} hint={t('Huit caractères minimum.', 'At least eight characters.')}>
          <TextInput
            value={pw.next}
            onChangeText={(v) => setPw({ ...pw, next: v })}
            style={inputStyle}
            placeholder="••••••••"
            placeholderTextColor={Light.faint}
            secureTextEntry
            textContentType="newPassword"
            autoCapitalize="none"
          />
        </Field>
        <Field label={t('Confirmer', 'Confirm')}>
          <TextInput
            value={pw.confirm}
            onChangeText={(v) => setPw({ ...pw, confirm: v })}
            style={inputStyle}
            placeholder="••••••••"
            placeholderTextColor={Light.faint}
            secureTextEntry
            textContentType="newPassword"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={changePassword}
          />
        </Field>
        {pwError ? <Text style={styles.error}>{pwError}</Text> : null}
        <Button label={pwSaving ? t('Changement…', 'Changing…') : t('Changer le mot de passe', 'Change password')} tone="ghost" icon="lock" onPress={changePassword} disabled={pwSaving || !pw.next || !pw.confirm} />
      </Card>

      <Text style={styles.heading}>{t('Application', 'App')}</Text>
      <Card style={styles.group}>
        <ListRow
          first
          icon="bell"
          label={t('Notifications push', 'Push notifications')}
          hint={push ? pushLabel[push] : t('Vérification…', 'Checking…')}
          onPress={push === 'granted' || push === 'unsupported' ? undefined : togglePush}
          right={<View style={[styles.dot, { backgroundColor: push === 'granted' ? Light.success : Light.warning }]} />}
        />
        <ListRow
          icon="globe"
          label={t('Langue', 'Language')}
          hint={t("Aussi pour les pages du site dans l'app", 'Also applies to website pages in the app')}
          right={
            <Segmented<Locale>
              options={[
                { value: 'fr', label: 'FR' },
                { value: 'en', label: 'EN' },
              ]}
              value={locale}
              onChange={setLocale}
            />
          }
        />
        <ListRow icon="file-text" label={t("Conditions d'utilisation", 'Terms of use')} onPress={() => Linking.openURL(`${SITE_URL}${withLang('/legal/cgu', locale)}`)} />
        <ListRow icon="shield" label={t('Politique de confidentialité', 'Privacy policy')} onPress={() => Linking.openURL(`${SITE_URL}${withLang('/legal/confidentialite', locale)}`)} />
        <ListRow icon="info" label="Version" hint={`twocards ${version}`} />
      </Card>

      <Card style={styles.group}>
        <ListRow first icon="log-out" label={t('Se déconnecter', 'Log out')} tone="danger" onPress={signOut} />
        <ListRow
          icon="trash-2"
          label={t('Demander la suppression de mon compte', 'Request account deletion')}
          hint={t('Par e-mail à twocards', 'By email to twocards')}
          onPress={requestDeletion}
        />
      </Card>
    </StackScreen>
  )
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Light.ink,
    borderWidth: 2,
    borderColor: Light.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  headName: {
    fontSize: 17,
    fontWeight: '700',
    color: Light.ink,
  },
  headHint: {
    fontSize: 12,
    color: Light.muted,
  },
  headLink: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: Light.accent,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    color: Light.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
    marginBottom: -6,
    marginTop: 4,
  },
  form: {
    gap: 14,
  },
  twoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  error: {
    fontSize: 13,
    color: Light.danger,
  },
  group: {
    paddingVertical: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
})
