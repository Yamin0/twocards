import { SiteWebView } from '@/components/site-webview';
import { VenueHome } from '@/components/venue/home';
import { useAuth } from '@/lib/auth-context';
import { isVenueTabRole, roleTabs } from '@/lib/site';

/* Accueil : natif pour l'établissement, la page du site pour les autres. */
export default function HomeTab() {
  const { tabRole } = useAuth();
  if (isVenueTabRole(tabRole)) return <VenueHome />;
  return <SiteWebView path={roleTabs[tabRole].home} />;
}
