import { usePathname, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { Button, Icon, Screen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useT } from '@/lib/i18n'
import { reportError } from '@/lib/report-error'

/* Un lien qui ne mène nulle part : retour à l'accueil, sans drame. */
export default function NotFoundScreen() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useT()
  useEffect(() => {
    reportError('message', 'Page introuvable', `not-found:${pathname}`)
  }, [pathname])
  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Icon name="compass" size={24} color={Light.accent} />
        </View>
        <Text style={styles.title}>{t("Cette page n'existe pas", "This page doesn't exist")}</Text>
        <Text style={styles.body}>
          {t("Le lien est peut-être ancien. Tout ce qui compte est sur l'accueil.", 'The link may be out of date. Everything that matters is on the home screen.')}
        </Text>
        <Button label={t("Retour à l'accueil", 'Back to home')} onPress={() => router.replace('/')} style={styles.button} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Light.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Light.ink,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: Light.muted,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
  },
})
