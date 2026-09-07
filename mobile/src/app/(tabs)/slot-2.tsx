import { SiteWebView } from '@/components/site-webview';
import { useAuth } from '@/lib/auth-context';
import { roleTabs } from '@/lib/site';

export default function SecondTab() {
  const { role } = useAuth();
  return <SiteWebView path={roleTabs[role][1].path} tabIndex={1} />;
}
