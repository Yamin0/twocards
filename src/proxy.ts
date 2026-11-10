import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage } from "@/lib/i18n";

export async function proxy(request: NextRequest) {
  /* Langue : `?lang=en|fr` force le choix, sinon le cookie, sinon la
     langue du navigateur. Le cookie est posé sur la requête (pour que le
     rendu serveur le lise dès ce passage) et sur la réponse. */
  const param = request.nextUrl.searchParams.get("lang");
  const current = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(param)
    ? param
    : isLocale(current)
      ? current
      : localeFromAcceptLanguage(request.headers.get("accept-language"));
  const changed = locale !== current;
  if (changed) request.cookies.set(LOCALE_COOKIE, locale);

  /* `?lang=` est retiré de l'adresse une fois le cookie posé. */
  let response: NextResponse;
  if (isLocale(param)) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    response = NextResponse.redirect(url);
  } else {
    response = await updateSession(request);
  }

  if (changed) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (callback/signout route handlers — no session logic needed)
     * - public files (images, videos, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|woff2)$).*)",
  ],
};
