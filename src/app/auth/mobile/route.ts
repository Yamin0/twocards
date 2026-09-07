import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* Entrée de l'application mobile dans les dashboards.

   L'app native possède sa propre session Supabase. Pour afficher le site dans
   sa WebView, elle demande à la fonction « mobile-session » un jeton de
   connexion à usage unique, puis charge cette route : le jeton est échangé
   contre une session *cookie* indépendante (donc pas de conflit de
   rafraîchissement avec la session native), et l'on redirige vers la page
   demandée. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Chemin interne uniquement : refuse "//evil.com" et les URLs absolues
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
