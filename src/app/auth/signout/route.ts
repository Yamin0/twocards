import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Referer attaquable : on ne garde que l'origin, avec repli sûr
  let origin: string;
  try {
    origin = new URL(request.headers.get("referer") || request.url).origin;
  } catch {
    origin = new URL(request.url).origin;
  }
  return NextResponse.redirect(`${origin}/`, {
    status: 302,
  });
}
