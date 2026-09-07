import { SiteWebView } from '@/components/site-webview';
import { useAuth } from '@/lib/auth-context';
import { roleTabs } from '@/lib/site';

export default function SecondTab() {
  const { tabRole } = useAuth();
  return <SiteWebView path={roleTabs[tabRole][1].path} tabIndex={1} />;
}
