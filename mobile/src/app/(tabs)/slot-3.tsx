import { SiteWebView } from '@/components/site-webview';
import { useAuth } from '@/lib/auth-context';
import { roleTabs } from '@/lib/site';

export default function ThirdTab() {
  const { tabRole } = useAuth();
  return <SiteWebView path={roleTabs[tabRole][2].path} tabIndex={2} />;
}
