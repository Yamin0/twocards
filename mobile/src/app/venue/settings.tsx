import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, StyleSheet, Text, TextInput, View } from 'react-native'

import { Avatar, Button, Card, Field, ListRow, StackScreen, inputStyle } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { pushStatus, registerPush, unregisterPush, type PushStatus } from '@/lib/push'
import { roleLabels } from '@/lib/site'
import { supabase } from '@/lib/supabase'
import { updateProfile } from '@/lib/venue-data'

/* Profil et paramètres : les quatre champs qui comptent, les notifications,
   la déconnexion. Le reste (mot de passe, portail) reste sur le site. */

const CONTACT_EMAIL = 'contact@twocardspro.com'

export default function SettingsScreen() {
  const { session, role, tabRole, fullName, venueName } = useAuth()
  const userId = session?.user.id ?? null
  const email = session?.user.email ?? '—'
  const meta = session?.user.user_metadata ?? {}

  const [form, setForm] = useState({
    full_name: fullName ?? '',
    venue_name: venueName ?? '',
    city: (meta.city as string | undefined) ?? '',
    phone: (meta.phone as string | undefined) ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [push, setPush] = useState<PushStatus | null>(null)

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
    const ok = await updateProfile(userId, {
      full_name: form.full_name.trim(),
      venue_name: form.venue_name.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
    })
    setSaving(false)
    setSaved(ok ? 'Profil enregistré.' : "Enregistrement impossible. Vérifiez votre connexion.")
  }, [userId, form])

  const togglePush = useCallback(async () => {
    if (!userId || push === 'granted' || push === 'unsupported') return
    if (push === 'denied') {
      Linking.openSettings()
      return
    }
    setPush(await registerPush(userId))
  }, [userId, push])

  const signOut = async () => {
    await unregisterPush().catch(() => {})
    await supabase.auth.signOut()
  }

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
        <Avatar name={form.full_name || form.venue_name || 'T'} size={56} />
        <View style={styles.headText}>
          <Text style={styles.headName} numberOfLines={1}>
            {form.venue_name || 'Votre établissement'}
          </Text>
          <Text style={styles.headHint}>
            {tabRole === 'activite' ? 'Activités & services' : roleLabels[role]} · {email}
          </Text>
        </View>
      </Card>

      <Card style={styles.form}>
        <Field label="Nom du responsable">
          <TextInput
            value={form.full_name}
            onChangeText={(v) => setForm({ ...form, full_name: v })}
            style={inputStyle}
            placeholder="Prénom Nom"
            placeholderTextColor={Light.faint}
            autoCapitalize="words"
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
        <Field label="Téléphone" hint="Celui que les hôtels et concierges peuvent appeler.">
          <TextInput
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            style={inputStyle}
            placeholder="+212 6 …"
            placeholderTextColor={Light.faint}
            keyboardType="phone-pad"
          />
        </Field>
        {saved && <Text style={[styles.saved, saved.startsWith('Profil') ? styles.ok : styles.ko]}>{saved}</Text>}
        <Button
          label={saving ? 'Enregistrement…' : 'Enregistrer'}
          onPress={save}
          disabled={!dirty || saving}
        />
      </Card>

      <Card style={styles.group}>
        <ListRow
          first
          icon="bell"
          label="Notifications push"
          hint={push ? pushLabel[push] : 'Vérification…'}
          onPress={push === 'granted' || push === 'unsupported' ? undefined : togglePush}
          right={<View style={[styles.dot, { backgroundColor: push === 'granted' ? Light.success : Light.warning }]} />}
        />
        <ListRow
          icon="lock"
          label="Mot de passe"
          hint="Se change depuis le site, rubrique Paramètres"
          onPress={() => Linking.openURL('https://www.twocardspro.com/dashboard/settings')}
        />
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
  form: {
    gap: 14,
  },
  saved: {
    fontSize: 13,
    fontWeight: '600',
  },
  ok: {
    color: Light.success,
  },
  ko: {
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
