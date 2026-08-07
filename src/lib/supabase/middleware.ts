import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Match "/concierge" et "/concierge/..." mais pas "/concierges" (page publique)
  const inSection = (section: string) =>
    pathname === section || pathname.startsWith(`${section}/`);

  // Espace privé de chaque rôle ; tout autre rôle est renvoyé vers le sien
  const roleHome: Record<string, string> = {
    concierge: "/concierge",
    hotel: "/hotel",
    etablissement: "/dashboard",
    admin: "/admin",
  };
  const protectedSections = Object.values(roleHome);

  // Protected routes: redirect to login if not authenticated
  if (!user && protectedSections.some(inSection)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const role = (user.app_metadata?.role ?? user.user_metadata?.role) as
      | string
      | undefined;
    const home = roleHome[role ?? ""] ?? "/dashboard";

    /* L'administrateur circule dans tous les espaces : c'est le sens même
       du rôle. Seule la page de connexion le renvoie chez lui. */
    const isAdmin = user.app_metadata?.is_admin === true;
    if (isAdmin) {
      if (pathname === "/login" || pathname === "/signup") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // Redirect authenticated users away from login/signup to their role-specific dashboard
    if (pathname === "/login" || pathname === "/signup") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }

    // Redirect users landing in another role's section to their own
    const currentSection = protectedSections.find(inSection);
    if (currentSection && currentSection !== home) {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
