import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { RETURN_COOKIE, endViewAs } from "@/lib/admin/view-as";

export async function POST(request: Request) {
  // Referer attaquable : on ne garde que l'origin, avec repli sûr
  let origin: string;
  try {
    origin = new URL(request.headers.get("referer") || request.url).origin;
  } catch {
    origin = new URL(request.url).origin;
  }

  /* Pendant une visite « en tant que », « Se déconnecter » met fin à la
     visite et ramène l'admin chez lui. Surtout pas de déconnexion globale :
     elle fermerait la session du vrai titulaire sur tous ses appareils. */
  if ((await cookies()).get(RETURN_COOKIE)) {
    const home = await endViewAs();
    return NextResponse.redirect(`${origin}${home}`, { status: 302 });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/`, {
    status: 302,
  });
}
