import { SiteWebView } from '@/components/site-webview';
import { VenueHome } from '@/components/venue/home';
import { useAuth } from '@/lib/auth-context';
import { isVenueTabRole, roleTabs } from '@/lib/site';

/* Premier onglet : natif pour l'établissement, le site pour les autres. */
export default function HomeTab() {
  const { tabRole } = useAuth();
  if (isVenueTabRole(tabRole)) return <VenueHome />;
  return <SiteWebView path={roleTabs[tabRole][0].path} tabIndex={0} />;
}
