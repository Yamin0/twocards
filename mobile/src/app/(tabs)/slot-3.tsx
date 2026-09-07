import { SiteWebView } from '@/components/site-webview';
import { useAuth } from '@/lib/auth-context';
import { roleTabs } from '@/lib/site';

export default function ThirdTab() {
  const { role } = useAuth();
  return <SiteWebView path={roleTabs[role][2].path} />;
}
