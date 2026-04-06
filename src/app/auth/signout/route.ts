import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = request.headers.get("referer") || request.url;
  const { origin } = new URL(url);
  return NextResponse.redirect(`${origin}/`, {
    status: 302,
  });
}
