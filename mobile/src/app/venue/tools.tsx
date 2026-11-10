import { useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'

import { Card, ListRow, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/i18n'
import { getVenueTools, getWebPages } from '@/lib/site'

/* Les outils peu utilisés au lancement, rangés derrière « Plus ». Ils
   s'ouvrent dans l'app, sur les pages du site en clair. */
export default function ToolsScreen() {
  const { tabRole } = useAuth()
  const router = useRouter()
  const t = useT()
  const items = getVenueTools(t)[tabRole === 'activite' ? 'activite' : 'etablissement']

  return (
    <StackScreen title={t('Plus', 'More')} subtitle={t('Outils', 'Tools')}>
      <Text style={styles.intro}>
        {t(
          "Ce que vous n'ouvrez pas tous les jours. Ces pages viennent du site et s'affichent ici, à votre échelle.",
          "What you don't open every day. These pages come from the website and are shown here, sized for your phone."
        )}
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
              router.push({ pathname: '/web', params: { path: i.path ?? '/dashboard', title: getWebPages(t)[i.path ?? ''] ?? i.label } })
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
