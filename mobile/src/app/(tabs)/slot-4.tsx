import { SiteWebView } from '@/components/site-webview';
import { useAuth } from '@/lib/auth-context';
import { roleTabs } from '@/lib/site';

export default function FourthTab() {
  const { role } = useAuth();
  return <SiteWebView path={roleTabs[role][3].path} tabIndex={3} />;
}
