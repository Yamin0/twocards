import Constants from 'expo-constants'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { Avatar, Button, Card, Field, Icon, ListRow, StackScreen, inputStyle } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { haptic } from '@/lib/haptics'
import { pushStatus, registerPush, unregisterPush, type PushStatus } from '@/lib/push'
import { roleLabels, SITE_URL } from '@/lib/site'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import { updateAvatar, updatePassword, updateProfile } from '@/lib/venue-data'

/* Profil et paramètres : la photo, les quatre champs qui comptent, le mot
   de passe, les notifications, la déconnexion. */

const CONTACT_EMAIL = 'contact@twocardspro.com'

export default function SettingsScreen() {
  const { session, role, tabRole, fullName, venueName, avatarUrl } = useAuth()
  const toast = useToast()
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
      toast.show({ message: 'Profil enregistré', tone: 'success' })
    } else {
      haptic.error()
      toast.show({ message: 'Enregistrement impossible. Vérifiez votre connexion.', tone: 'danger' })
    }
  }, [userId, form, toast])

  const changePhoto = async () => {
    if (!userId || uploading) return
    setUploading(true)
    try {
      const url = await updateAvatar(userId)
      if (url === null) toast.show({ message: 'Photo non enregistrée. Réessayez.', tone: 'danger' })
      else if (url) {
        haptic.success()
        toast.show({ message: 'Photo mise à jour', tone: 'success' })
      }
    } catch {
      toast.show({ message: "Envoi de la photo impossible.", tone: 'danger' })
    } finally {
      setUploading(false)
    }
  }

  const changePassword = async () => {
    if (pw.next.length < 8) {
      setPwError('Huit caractères minimum.')
      return
    }
    if (pw.next !== pw.confirm) {
      setPwError('Les deux saisies ne correspondent pas.')
      return
    }
    setPwSaving(true)
    setPwError('')
    haptic.tap()
    const err = await updatePassword(pw.next)
    setPwSaving(false)
    if (err) {
      haptic.error()
      setPwError(err)
      return
    }
    haptic.success()
    setPw({ next: '', confirm: '' })
    toast.show({ message: 'Mot de passe changé', tone: 'success' })
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
    Alert.alert('Se déconnecter ?', 'Vous ne recevrez plus de notifications sur ce téléphone.', [
      { text: 'Rester', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          await unregisterPush().catch(() => {})
          await supabase.auth.signOut()
        },
      },
    ])

  const requestDeletion = () => {
    const subject = encodeURIComponent('Suppression de mon compte twocards')
    const body = encodeURIComponent(
      `Bonjour,\n\nJe demande la suppression de mon compte twocards et des données associées.\n\nCompte : ${email}\n\nMerci.`
    )
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`).catch(() =>
      Alert.alert('Aucune application de messagerie', `Écrivez à ${CONTACT_EMAIL} depuis votre adresse ${email}.`)
    )
  }

  const pushLabel: Record<PushStatus, string> = {
    granted: 'Activées sur ce téléphone',
    denied: 'Refusées, toucher pour ouvrir les réglages',
    undetermined: 'Toucher pour activer',
    unsupported: 'Indisponibles sur cet appareil',
  }

  return (
    <StackScreen title="Paramètres">
      <Card style={styles.head}>
        <Pressable onPress={changePhoto} style={styles.avatarWrap} accessibilityLabel="Changer la photo">
          <Avatar name={form.full_name || form.venue_name || 'T'} size={64} uri={avatarUrl} />
          <View style={styles.avatarBadge}>
            {uploading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="camera" size={12} color="#FFFFFF" />}
          </View>
        </Pressable>
        <View style={styles.headText}>
          <Text style={styles.headName} numberOfLines={1}>
            {form.venue_name || 'Votre établissement'}
          </Text>
          <Text style={styles.headHint} numberOfLines={1}>
            {tabRole === 'activite' ? 'Activités & services' : roleLabels[role]} · {email}
          </Text>
          <Pressable onPress={changePhoto} hitSlop={6}>
            <Text style={styles.headLink}>{avatarUrl ? 'Changer la photo' : 'Ajouter une photo ou un logo'}</Text>
          </Pressable>
        </View>
      </Card>

      <Text style={styles.heading}>Établissement</Text>
      <Card style={styles.form}>
        <Field label="Nom du responsable">
          <TextInput
            value={form.full_name}
            onChangeText={(v) => setForm({ ...form, full_name: v })}
            style={inputStyle}
            placeholder="Prénom Nom"
            placeholderTextColor={Light.faint}
            autoCapitalize="words"
            textContentType="name"
          />
        </Field>
        <Field label="Établissement">
          <TextInput
            value={form.venue_name}
            onChangeText={(v) => setForm({ ...form, venue_name: v })}
            style={inputStyle}
            placeholder="Nom affiché aux hôtels"
            placeholderTextColor={Light.faint}
          />
        </Field>
        <View style={styles.twoCols}>
          <View style={styles.col}>
            <Field label="Ville">
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
            <Field label="Téléphone">
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
        <Button label={saving ? 'Enregistrement…' : 'Enregistrer'} onPress={save} disabled={!dirty || saving} />
      </Card>

      <Text style={styles.heading}>Sécurité</Text>
      <Card style={styles.form}>
        <Field label="Nouveau mot de passe" hint="Huit caractères minimum.">
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
        <Field label="Confirmer">
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
        <Button label={pwSaving ? 'Changement…' : 'Changer le mot de passe'} tone="ghost" icon="lock" onPress={changePassword} disabled={pwSaving || !pw.next || !pw.confirm} />
      </Card>

      <Text style={styles.heading}>Application</Text>
      <Card style={styles.group}>
        <ListRow
          first
          icon="bell"
          label="Notifications push"
          hint={push ? pushLabel[push] : 'Vérification…'}
          onPress={push === 'granted' || push === 'unsupported' ? undefined : togglePush}
          right={<View style={[styles.dot, { backgroundColor: push === 'granted' ? Light.success : Light.warning }]} />}
        />
        <ListRow icon="file-text" label="Conditions d'utilisation" onPress={() => Linking.openURL(`${SITE_URL}/legal/cgu`)} />
        <ListRow icon="shield" label="Politique de confidentialité" onPress={() => Linking.openURL(`${SITE_URL}/legal/confidentialite`)} />
        <ListRow icon="info" label="Version" hint={`twocards ${version}`} />
      </Card>

      <Card style={styles.group}>
        <ListRow first icon="log-out" label="Se déconnecter" tone="danger" onPress={signOut} />
        <ListRow icon="trash-2" label="Demander la suppression de mon compte" hint="Par e-mail à twocards" onPress={requestDeletion} />
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
