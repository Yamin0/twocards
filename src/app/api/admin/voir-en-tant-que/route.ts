import { NextResponse, type NextRequest } from "next/server";
import { endViewAs, startViewAs, viewAsStatus } from "@/lib/admin/view-as";

/* « Voir en tant que » (administrateur) — logique dans @/lib/admin/view-as.
   POST : ouvre l'espace d'un compte, en lecture seule.
   GET : état de la visite en cours, pour le bandeau.
   DELETE : fin de visite, retour à l'administration. */

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  let userId: unknown;
  try {
    ({ userId } = (await request.json()) as { userId?: unknown });
  } catch {
    return NextResponse.json({ error: "Corps JSON attendu." }, { status: 400, headers: noStore });
  }
  const result = await startViewAs(userId, request.nextUrl.protocol === "https:");
  return result.ok
    ? NextResponse.json({ home: result.home }, { headers: noStore })
    : NextResponse.json({ error: result.error }, { status: result.status, headers: noStore });
}

export async function GET() {
  return NextResponse.json(await viewAsStatus(), { headers: noStore });
}

export async function DELETE() {
  return NextResponse.json({ home: await endViewAs() }, { headers: noStore });
}
