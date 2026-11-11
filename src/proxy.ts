import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { detectLocale, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import {
  COUNTRY_COOKIE,
  CURRENCY_COOKIE,
  currencyForCountry,
  GEO_COUNTRY_HEADER,
  parseCountry,
  parseCurrency,
} from "@/lib/currency";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function proxy(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const acceptLanguage = request.headers.get("accept-language");

  /* Pays du visiteur : Vercel le déduit de l'adresse IP (`x-vercel-ip-country`).
     En local l'en-tête manque : on peut le simuler avec `?country=DE`,
     gardé le temps de la session du navigateur ; `?country=auto` l'efface.
     Un `curl -H "x-vercel-ip-country: DE"` marche aussi. */
  const countryParam = params.get("country");
  const resetsCountry = countryParam !== null;
  const simulatedCountry = resetsCountry
    ? parseCountry(countryParam)
    : parseCountry(request.cookies.get(COUNTRY_COOKIE)?.value);
  const country =
    simulatedCountry ?? parseCountry(request.headers.get(GEO_COUNTRY_HEADER));
  /* Une simulation de pays rejoue un premier passage depuis ce pays :
     langue et devise sont recalculées, sans tenir compte du navigateur. */
  const simulatingNow = resetsCountry && simulatedCountry !== null;

  /* Langue : `?lang=en|fr` force le choix, sinon le cookie, sinon la
     langue du navigateur puis le pays. Le cookie est posé sur la requête
     (pour que le rendu serveur le lise dès ce passage) et sur la réponse. */
  const langParam = params.get("lang");
  const currentLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(langParam)
    ? langParam
    : resetsCountry
      ? detectLocale(simulatingNow ? null : acceptLanguage, country)
      : isLocale(currentLocale)
        ? currentLocale
        : detectLocale(acceptLanguage, country);
  const localeChanged = locale !== currentLocale;
  if (localeChanged) request.cookies.set(LOCALE_COOKIE, locale);

  /* Devise : `?currency=eur|mad|usd` ou le sélecteur (cookie d'un an),
     sinon celle du pays. Seul un choix manuel est mémorisé : un visiteur
     qui voyage voit la devise de là où il est. La devise retenue est
     toujours posée sur la requête pour le rendu serveur. */
  const currencyParam = parseCurrency(params.get("currency"));
  const savedCurrency = resetsCountry
    ? null
    : parseCurrency(request.cookies.get(CURRENCY_COOKIE)?.value);
  const currency = currencyParam ?? savedCurrency ?? currencyForCountry(country);
  request.cookies.set(CURRENCY_COOKIE, currency);

  /* `?lang=`, `?currency=` et `?country=` sont retirés de l'adresse une
     fois les cookies posés. */
  const consumed = [
    isLocale(langParam) && "lang",
    currencyParam && "currency",
    resetsCountry && "country",
  ].filter((p): p is string => Boolean(p));

  let response: NextResponse;
  if (consumed.length) {
    const url = request.nextUrl.clone();
    for (const p of consumed) url.searchParams.delete(p);
    response = NextResponse.redirect(url);
  } else {
    response = await updateSession(request);
  }

  const persistent = { path: "/", maxAge: ONE_YEAR, sameSite: "lax" } as const;
  const expired = { path: "/", maxAge: 0, sameSite: "lax" } as const;

  if (localeChanged) response.cookies.set(LOCALE_COOKIE, locale, persistent);

  if (currencyParam) response.cookies.set(CURRENCY_COOKIE, currencyParam, persistent);
  else if (resetsCountry) response.cookies.set(CURRENCY_COOKIE, "", expired);

  if (resetsCountry) {
    if (simulatedCountry) {
      /* Cookie de session (sans durée) : la simulation s'arrête à la
         fermeture du navigateur. */
      response.cookies.set(COUNTRY_COOKIE, simulatedCountry, { path: "/", sameSite: "lax" });
    } else {
      response.cookies.set(COUNTRY_COOKIE, "", expired);
    }
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
