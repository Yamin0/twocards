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

  // Protected routes: redirect to login if not authenticated
  if (
    !user &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/concierge"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login/signup to their role-specific dashboard
  if (
    user &&
    (pathname === "/login" || pathname === "/signup")
  ) {
    const role = user.user_metadata?.role;
    const url = request.nextUrl.clone();
    url.pathname = role === "concierge" ? "/concierge" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Redirect concierge users away from /dashboard to /concierge
  if (user && pathname.startsWith("/dashboard")) {
    const role = user.user_metadata?.role;
    if (role === "concierge") {
      const url = request.nextUrl.clone();
      url.pathname = "/concierge";
      return NextResponse.redirect(url);
    }
  }

  // Redirect etablissement users away from /concierge to /dashboard
  if (user && pathname.startsWith("/concierge")) {
    const role = user.user_metadata?.role;
    if (role !== "concierge") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
