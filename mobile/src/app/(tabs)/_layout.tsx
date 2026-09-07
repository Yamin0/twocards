import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Light, SHELL_BG_DARK } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useBadgeCounts } from '@/lib/badges';
import { isVenueTabRole, roleTabs } from '@/lib/site';

/* Deux barres d'onglets.

   L'établissement (restaurant, club, activité, service) a trois onglets
   natifs : Réservations à gauche pour accepter une demande en deux gestes,
   Accueil au centre, Menu à droite pour tout le reste.

   Les autres rôles gardent quatre fentes (index, slot-2…4) remplies selon
   le rôle par des pages du site, plus le profil. Les routes qui ne servent
   pas à un rôle restent déclarées mais cachées : la barre native exige un
   déclencheur par route. */
const SLOTS = ['index', 'slot-2', 'slot-3', 'slot-4'] as const;

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <NativeTabs.Trigger.Badge>{count > 99 ? '99+' : String(count)}</NativeTabs.Trigger.Badge>;
}

export default function TabsLayout() {
  const { tabRole } = useAuth();
  const counts = useBadgeCounts();

  if (isVenueTabRole(tabRole)) {
    return (
      <NativeTabs
        backgroundColor={Light.card}
        tintColor={Light.accent}
        badgeBackgroundColor={Light.accent}
        labelStyle={{ selected: { color: Light.accent } }}>
        <NativeTabs.Trigger name="reservations">
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
        <NativeTabs.Trigger name="slot-2" hidden />
        <NativeTabs.Trigger name="slot-3" hidden />
        <NativeTabs.Trigger name="slot-4" hidden />
        <NativeTabs.Trigger name="profile" hidden />
      </NativeTabs>
    );
  }

  const tabs = roleTabs[tabRole];
  return (
    <NativeTabs
      backgroundColor={SHELL_BG_DARK}
      indicatorColor="rgba(255,255,255,0.14)"
      labelStyle={{ selected: { color: '#ffffff' } }}>
      {SLOTS.map((name, i) => {
        const tab = tabs[i];
        const count = tab.badge ? counts[tab.badge] : 0;
        return (
          <NativeTabs.Trigger key={name} name={name}>
            <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
            <Badge count={count} />
          </NativeTabs.Trigger>
        );
      })}
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reservations" hidden />
      <NativeTabs.Trigger name="hub" hidden />
    </NativeTabs>
  );
}
