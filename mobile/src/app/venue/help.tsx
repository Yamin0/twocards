import { Linking, StyleSheet, Text } from 'react-native'

import { Card, ListRow, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'

const CONTACT_EMAIL = 'contact@twocardspro.com'

const FAQ = [
  {
    q: 'Comment une réservation arrive-t-elle ?',
    a: "Un client d'hôtel scanne le QR de sa chambre, choisit votre adresse et une date. La demande apparaît dans Réservations et vous êtes notifié. Vous confirmez par téléphone ou WhatsApp, puis d'un geste dans l'app.",
  },
  {
    q: 'Quand la commission se calcule-t-elle ?',
    a: "Dès que vous saisissez l'addition d'une sortie apportée par un hôtel : 10 % du montant par défaut. Les réservations de votre portail direct et celles prises par vous-même ne sont jamais commissionnées.",
  },
  {
    q: 'Qui règle qui ?',
    a: "Chaque mois clôturé, twocards collecte les commissions auprès de l'établissement et les reverse aux hôtels apporteurs. La page Commissions dit ce qui reste à régler et ce qui l'a été.",
  },
  {
    q: 'Le client est arrivé, que faire ?',
    a: "Touchez « Client arrivé » sur la réservation : l'hôtel le voit aussi. Puis « Saisir l'addition » en fin de service.",
  },
]

export default function HelpScreen() {
  return (
    <StackScreen title="Aide">
      <Card style={styles.group}>
        <ListRow
          first
          icon="mail"
          label="Écrire à twocards"
          hint={CONTACT_EMAIL}
          onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
        />
        <ListRow
          icon="globe"
          label="twocardspro.com"
          hint="Le site, les guides"
          onPress={() => Linking.openURL('https://www.twocardspro.com')}
        />
      </Card>
      <Text style={styles.heading}>Questions fréquentes</Text>
      {FAQ.map((f) => (
        <Card key={f.q}>
          <Text style={styles.q}>{f.q}</Text>
          <Text style={styles.a}>{f.a}</Text>
        </Card>
      ))}
    </StackScreen>
  )
}

const styles = StyleSheet.create({
  group: {
    paddingVertical: 0,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    color: Light.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
    marginTop: 4,
  },
  q: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  a: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: Light.muted,
  },
})
