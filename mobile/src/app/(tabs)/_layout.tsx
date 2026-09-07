import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAuth } from '@/lib/auth-context';
import { useBadgeCounts } from '@/lib/badges';
import { roleTabs, SHELL_BG } from '@/lib/site';

/* Les quatre premiers onglets sont des fentes (index, slot-2…4) dont le
   contenu dépend du rôle ; chaque écran lit sa page dans `roleTabs`. */
const SLOTS = ['index', 'slot-2', 'slot-3', 'slot-4'] as const;

export default function TabsLayout() {
  const { tabRole } = useAuth();
  const tabs = roleTabs[tabRole];
  const counts = useBadgeCounts();

  return (
    <NativeTabs
      backgroundColor={SHELL_BG}
      indicatorColor="rgba(255,255,255,0.14)"
      labelStyle={{ selected: { color: '#ffffff' } }}>
      {SLOTS.map((name, i) => {
        const tab = tabs[i];
        const count = tab.badge ? counts[tab.badge] : 0;
        return (
          <NativeTabs.Trigger key={name} name={name}>
            <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
            {count > 0 && (
              <NativeTabs.Trigger.Badge>
                {count > 99 ? '99+' : String(count)}
              </NativeTabs.Trigger.Badge>
            )}
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
    </NativeTabs>
  );
}
