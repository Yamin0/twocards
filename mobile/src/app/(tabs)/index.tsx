import { SiteWebView } from '@/components/site-webview';
import { useAuth } from '@/lib/auth-context';
import { roleTabs } from '@/lib/site';

export default function HomeTab() {
  const { tabRole } = useAuth();
  return <SiteWebView path={roleTabs[tabRole][0].path} tabIndex={0} />;
}
