/* Preuve que la demande d'accès envoie à Supabase exactement ce qu'elle
   envoyait avant le passage à deux écrans.

   node REFONTE/outils/signup-payload.mjs

   `ancien` reprend mot pour mot l'expression de src/app/signup/page.tsx au
   commit 01f3a45 (git show 01f3a45:src/app/signup/page.tsx, lignes 152 à
   174) ; `buildSignUp` est le code actuel, chargé tel quel (Node retire les
   types). Les deux sont comparés sur toutes les combinaisons de métier, de
   saisie et de choix ci-dessous. Rien n'est envoyé nulle part. */
import { buildSignUp, normalizeInstagram } from "../../src/app/signup/_lib/signup-payload.ts";

const origin = "http://localhost:3000";

function ancien(kind, form, venueType, conciergeType, audienceSize) {
  const hasVenue = kind === "hotel" || kind === "etablissement";
  return {
    email: form.email,
    password: form.password,
    options: {
      data: {
        full_name: form.fullname,
        phone: form.phone,
        instagram: normalizeInstagramAncien(form.instagram),
        role: kind === "influenceur" ? "concierge" : kind,
        signup_profile: kind,
        venue_name: hasVenue ? form.venueName : null,
        venue_type: kind === "etablissement" ? venueType : null,
        city: hasVenue ? form.city : null,
        rooms_count: kind === "hotel" && form.rooms ? Number(form.rooms) : null,
        organization: kind === "concierge" ? form.organization.trim() || null : null,
        concierge_type: kind === "concierge" ? conciergeType : null,
        audience_size: kind === "influenceur" ? audienceSize : null,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  };
}
/* signup-form.tsx au même commit, lignes 121 à 129. */
function normalizeInstagramAncien(raw) {
  const handle = raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "")
    .toLowerCase();
  return handle || null;
}

const KINDS = ["hotel", "etablissement", "concierge", "influenceur"];
const VENUE_TYPES = ["restaurant", "rooftop", "club", "lounge", "bar", "beach-club", "activite", "service"];
const CONCIERGE_TYPES = [null, "hotel", "private", "rp"];
const AUDIENCES = [null, "lt10k", "10-50k", "50-200k", "gt200k"];
const INSTAGRAMS = ["", "  ", "@Karim", "karim.b", "https://www.instagram.com/Karim_B/?hl=fr", "instagram.com/x#y", "@@a"];
const ROOMS = ["", "45", "0", "12.5"];
const ORGS = ["", "  ", " Royal Mansour "];
const PHONES = ["", "+212 6 12 34 56 78"];
const VENUES = [
  { venueName: "", city: "" },
  { venueName: " Riad Palais Bleu ", city: "Marrakech " },
];

let compared = 0;
let different = 0;
const keys = new Set();
for (const kind of KINDS)
  for (const venueType of VENUE_TYPES)
    for (const conciergeType of CONCIERGE_TYPES)
      for (const audienceSize of AUDIENCES)
        for (const instagram of INSTAGRAMS)
          for (const rooms of ROOMS)
            for (const organization of ORGS)
              for (const phone of PHONES)
                for (const venue of VENUES) {
                  const form = {
                    ...venue,
                    rooms,
                    organization,
                    instagram,
                    phone,
                    fullname: " Karim Bennani",
                    email: "Karim@Example.com ",
                    password: "motdepasse ",
                  };
                  const a = ancien(kind, form, venueType, conciergeType, audienceSize);
                  const b = buildSignUp(kind, form, { venueType, conciergeType, audienceSize }, origin);
                  compared++;
                  Object.keys(b.options.data).forEach((k) => keys.add(k));
                  /* JSON.stringify garde l'ordre des clés : même ordre, mêmes valeurs. */
                  if (JSON.stringify(a) !== JSON.stringify(b)) {
                    different++;
                    if (different <= 5) console.log("DIFFÉRENCE", kind, JSON.stringify(a), JSON.stringify(b));
                  }
                }

for (const raw of INSTAGRAMS)
  if (normalizeInstagram(raw) !== normalizeInstagramAncien(raw)) {
    different++;
    console.log("DIFFÉRENCE instagram", JSON.stringify(raw));
  }

console.log(`Clés de options.data : ${[...keys].join(", ")}`);
console.log(`${compared} combinaisons comparées, ${different} différence(s).`);
for (const kind of KINDS) {
  const form = {
    venueName: "Riad Palais Bleu",
    city: "Marrakech",
    rooms: "45",
    organization: "Royal Mansour",
    instagram: "@Karim",
    fullname: "Karim Bennani",
    email: "karim@example.com",
    phone: "+212 6 12 34 56 78",
    password: "********",
  };
  const choices = { venueType: "rooftop", conciergeType: "rp", audienceSize: "10-50k" };
  console.log(kind, JSON.stringify(buildSignUp(kind, form, choices, origin).options));
}
process.exit(different ? 1 : 0);
