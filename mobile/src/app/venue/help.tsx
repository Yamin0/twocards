import { Linking, StyleSheet, Text } from 'react-native'

import { Card, ListRow, StackScreen } from '@/components/venue/ui'
import { Light } from '@/constants/theme'
import { useLocale, useT, withLang, type Translate } from '@/lib/i18n'

const CONTACT_EMAIL = 'contact@twocardspro.com'

const getFaq = (t: Translate) => [
  {
    q: t('Comment une réservation arrive-t-elle ?', 'How does a reservation come in?'),
    a: t(
      "Un client d'hôtel scanne le QR de sa chambre, choisit votre adresse et une date. La demande apparaît dans Réservations et vous êtes notifié. Vous confirmez par téléphone ou WhatsApp, puis d'un geste dans l'app.",
      'A hotel guest scans the QR code in their room, picks your venue and a date. The request appears in Reservations and you are notified. You confirm by phone or WhatsApp, then with one tap in the app.'
    ),
  },
  {
    q: t('Quand la commission se calcule-t-elle ?', 'When is the commission calculated?'),
    a: t(
      "Dès que vous saisissez l'addition d'une sortie apportée par un hôtel : 10 % du montant par défaut. Les réservations de votre portail direct et celles prises par vous-même ne sont jamais commissionnées.",
      'As soon as you enter the bill for an outing referred by a hotel: 10% of the amount by default. Reservations from your direct portal and those you take yourself are never commissioned.'
    ),
  },
  {
    q: t('Qui règle qui ?', 'Who pays whom?'),
    a: t(
      "Chaque mois clôturé, twocards collecte les commissions auprès de l'établissement et les reverse aux hôtels apporteurs. La page Commissions dit ce qui reste à régler et ce qui l'a été.",
      'Each closed month, twocards collects the commissions from the venue and pays them out to the referring hotels. The Commissions page shows what is still due and what has been settled.'
    ),
  },
  {
    q: t('Le client est arrivé, que faire ?', 'The guest has arrived, what now?'),
    a: t(
      "Touchez « Client arrivé » sur la réservation : l'hôtel le voit aussi. Puis « Saisir l'addition » en fin de service.",
      'Tap “Guest arrived” on the reservation: the hotel sees it too. Then “Enter the bill” at the end of service.'
    ),
  },
]

export default function HelpScreen() {
  const t = useT()
  const locale = useLocale()
  return (
    <StackScreen title={t('Aide', 'Help')}>
      <Card style={styles.group}>
        <ListRow
          first
          icon="mail"
          label={t('Écrire à twocards', 'Email twocards')}
          hint={CONTACT_EMAIL}
          onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
        />
        <ListRow
          icon="globe"
          label="twocardspro.com"
          hint={t('Le site, les guides', 'The website, the guides')}
          onPress={() => Linking.openURL(withLang('https://www.twocardspro.com/', locale))}
        />
      </Card>
      <Text style={styles.heading}>{t('Questions fréquentes', 'Frequently asked questions')}</Text>
      {getFaq(t).map((f) => (
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
