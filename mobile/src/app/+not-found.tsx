import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { Button, Icon, Screen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'

/* Un lien qui ne mène nulle part : retour à l'accueil, sans drame. */
export default function NotFoundScreen() {
  const router = useRouter()
  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Icon name="compass" size={24} color={Light.accent} />
        </View>
        <Text style={styles.title}>Cette page n&apos;existe pas</Text>
        <Text style={styles.body}>Le lien est peut-être ancien. Tout ce qui compte est sur l&apos;accueil.</Text>
        <Button label="Retour à l'accueil" onPress={() => router.replace('/')} style={styles.button} />
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
