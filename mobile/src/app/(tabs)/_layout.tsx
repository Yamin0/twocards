import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Light } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useBadgeCounts } from '@/lib/badges';
import { roleTabs } from '@/lib/site';

/* Trois onglets pour tout le monde : Réservations à gauche pour accepter
   une demande en deux gestes, Accueil au centre, Menu à droite pour tout
   le reste. L'administrateur n'a pas de réservations : son onglet est
   déclaré mais caché, la barre native exigeant un déclencheur par route. */
function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <NativeTabs.Trigger.Badge>{count > 99 ? '99+' : String(count)}</NativeTabs.Trigger.Badge>;
}

export default function TabsLayout() {
  const { tabRole } = useAuth();
  const counts = useBadgeCounts();
  const hasReservations = roleTabs[tabRole].reservations !== null;

  return (
    <NativeTabs
      backgroundColor={Light.card}
      tintColor={Light.accent}
      badgeBackgroundColor={Light.accent}
      labelStyle={{ selected: { color: Light.accent } }}>
      <NativeTabs.Trigger name="reservations" hidden={!hasReservations}>
        <NativeTabs.Trigger.Label>Réservations</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} md="event" />
        <Badge count={counts.reservations} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Accueil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="hub">
        <NativeTabs.Trigger.Label>Menu</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
          md="apps"
        />
        <Badge count={counts.messages} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
