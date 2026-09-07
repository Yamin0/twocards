import { useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'

import { Card, ListRow, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { VENUE_TOOLS, WEB_PAGES } from '@/lib/site'

/* Les outils peu utilisés au lancement, rangés derrière « Plus ». Ils
   s'ouvrent dans l'app, sur les pages du site en clair. */
export default function ToolsScreen() {
  const { tabRole } = useAuth()
  const router = useRouter()
  const items = VENUE_TOOLS[tabRole === 'activite' ? 'activite' : 'etablissement']

  return (
    <StackScreen title="Plus" subtitle="Outils">
      <Text style={styles.intro}>
        Ce que vous n&apos;ouvrez pas tous les jours. Ces pages viennent du site et s&apos;affichent ici, à
        votre échelle.
      </Text>
      <Card style={styles.group}>
        {items.map((i, idx) => (
          <ListRow
            key={i.path}
            first={idx === 0}
            icon={i.icon}
            label={i.label}
            hint={i.hint}
            onPress={() =>
              router.push({ pathname: '/web', params: { path: i.path ?? '/dashboard', title: WEB_PAGES[i.path ?? ''] ?? i.label } })
            }
          />
        ))}
      </Card>
    </StackScreen>
  )
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 13,
    lineHeight: 19,
    color: Light.muted,
  },
  group: {
    paddingVertical: 0,
  },
})
