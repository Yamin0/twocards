import {
  Phone,
  Mail,
  MapPin,
  Crown,
  Pencil,
  StickyNote,
  CalendarDays,
  Music,
  UtensilsCrossed,
  AlertTriangle,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";

const guest = {
  name: "Hicham El Guerrouj",
  phone: "+212 6 12 34 56 78",
  email: "h.elguerrouj@email.com",
  location: "Casablanca, Maarif",
  vip: "VIP Platinum",
  totalVisites: 23,
  depensesTotales: "124 000 MAD",
  depenseMoyenne: "539 MAD",
  tailleGroupeMoy: 4,
  premièreVisite: "Mars 2025",
  birthday: "14 Juin 1985",
  tablePreference: "Carrée VIP, près de la piste",
  musicStyle: "Deep House, Tech House",
  allergies: "Fruits de mer, Arachides",
};

const visitHistory = [
  {
    date: "28 Mars 2026",
    event: "Vendredi Signature",
    venue: "L'Arc Casablanca",
    table: "VIP 12",
    spend: "1 850 MAD",
    referral: "Youssef Alaoui",
  },
  {
    date: "14 Mars 2026",
    event: "Samedi Gold",
    venue: "L'Arc Casablanca",
    table: "VIP 8",
    spend: "2 300 MAD",
    referral: "Youssef Alaoui",
  },
  {
    date: "02 Mars 2026",
    event: "Soirée Privée",
    venue: "Raspoutine",
    table: "Carré 3",
    spend: "3 100 MAD",
    referral: "Amira Benjelloun",
  },
];

const upcoming = [
  {
    date: "05 Avr",
    event: "Vendredi Signature",
    time: "23h30",
    partySize: 6,
    status: "Confirmée",
  },
  {
    date: "12 Avr",
    event: "Soirée Anniversaire",
    time: "22h00",
    partySize: 12,
    status: "En attente",
  },
];

const notes = [
  {
    author: "Youssef A.",
    date: "28 Mars 2026",
    text: "Client fidèle, toujours très généreux. Préfère le champagne Ruinart. Arrivée généralement après minuit.",
  },
  {
    author: "Amira B.",
    date: "02 Mars 2026",
    text: "Organise un anniversaire le 12 avril pour sa femme. Demande gâteau personnalisé et décoration VIP.",
  },
];

const tags = [
  "High Spender",
  "Régulier",
  "VIP Anniversaire",
  "Champagne Lover",
  "Groupe +8",
  "Parrain Actif",
];

export default async function GuestProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="bg-surface-card rounded-md editorial-shadow p-6 flex flex-wrap items-start gap-6">
          {/* Avatar */}
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-semibold text-primary font-[family-name:var(--font-manrope)]">
              HE
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-primary-dark font-[family-name:var(--font-manrope)]">
                {guest.name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-on-surface/10 px-2.5 py-0.5 text-[0.6875rem] font-medium text-on-surface">
                <Crown className="h-3 w-3" strokeWidth={1.5} />
                {guest.vip}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                {guest.phone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {guest.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                {guest.location}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 bg-surface-mid rounded-sm px-4 py-2 text-sm text-on-surface-variant hover:text-on-background transition-colors">
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
              Modifier
            </button>
            <button className="inline-flex items-center gap-2 bg-primary text-white rounded-sm px-4 py-2 text-sm font-medium hover:bg-primary-dark transition-colors">
              <StickyNote className="h-3.5 w-3.5" strokeWidth={1.5} />
              Ajouter une note
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="px-6 pb-6">
        <div className="bg-primary-container rounded-md p-5 grid grid-cols-5 gap-6">
          {[
            { label: "Total Visites", value: guest.totalVisites },
            { label: "Dépenses Totales", value: guest.depensesTotales },
            { label: "Dépense Moyenne", value: guest.depenseMoyenne },
            { label: "Taille Groupe Moy.", value: guest.tailleGroupeMoy },
            { label: "Première Visite", value: guest.premièreVisite },
          ].map((m) => (
            <div key={m.label}>
              <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-primary-container">
                {m.label}
              </p>
              <p className="text-xl font-semibold text-white font-[family-name:var(--font-manrope)] mt-1">
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Two column layout */}
      <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left - 60% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Visit History */}
          <div className="bg-surface-card rounded-md editorial-shadow overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-base font-semibold text-primary-dark font-[family-name:var(--font-manrope)]">
                Historique des visites
              </h2>
            </div>
            <div className="grid grid-cols-6 gap-3 px-5 py-2 bg-surface-low">
              {["Date", "Événement", "Lieu", "Table", "Dépense", "Référent"].map(
                (h) => (
                  <span
                    key={h}
                    className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant"
                  >
                    {h}
                  </span>
                )
              )}
            </div>
            {visitHistory.map((v, i) => (
              <div
                key={i}
                className={`grid grid-cols-6 gap-3 px-5 py-3 text-sm ${i % 2 === 1 ? "bg-surface" : ""}`}
              >
                <span className="text-on-surface-variant">{v.date}</span>
                <span className="text-on-background font-medium">{v.event}</span>
                <span className="text-on-surface-variant">{v.venue}</span>
                <span className="text-on-background">{v.table}</span>
                <span className="text-on-background font-medium">{v.spend}</span>
                <span className="text-on-surface-variant">{v.referral}</span>
              </div>
            ))}
          </div>

          {/* Upcoming Reservations */}
          <div>
            <h2 className="text-base font-semibold text-primary-dark font-[family-name:var(--font-manrope)] mb-3">
              Réservations à venir
            </h2>
            <div className="space-y-3">
              {upcoming.map((r, i) => (
                <div
                  key={i}
                  className="bg-surface-card rounded-md editorial-shadow p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-md bg-primary/10 flex flex-col items-center justify-center">
                      <span className="text-xs font-semibold text-primary leading-none">
                        {r.date.split(" ")[0]}
                      </span>
                      <span className="text-[0.625rem] text-primary/70">
                        {r.date.split(" ")[1]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-background">
                        {r.event}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-on-surface-variant">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" strokeWidth={1.5} />
                          {r.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" strokeWidth={1.5} />
                          {r.partySize} personnes
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium ${r.status === "Confirmée" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - 40% */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <div className="bg-surface-card rounded-md editorial-shadow p-5">
            <h2 className="text-base font-semibold text-primary-dark font-[family-name:var(--font-manrope)] mb-4">
              Informations client
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CalendarDays
                  className="h-4 w-4 text-on-surface-variant mt-0.5"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                    Anniversaire
                  </p>
                  <p className="text-sm text-on-background">{guest.birthday}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Crown
                  className="h-4 w-4 text-on-surface-variant mt-0.5"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                    Préférence table
                  </p>
                  <p className="text-sm text-on-background">
                    {guest.tablePreference}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Music
                  className="h-4 w-4 text-on-surface-variant mt-0.5"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                    Style musical
                  </p>
                  <p className="text-sm text-on-background">{guest.musicStyle}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="h-4 w-4 text-error mt-0.5"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                    Allergies alimentaires
                  </p>
                  <p className="text-sm text-error">{guest.allergies}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-surface-card rounded-md editorial-shadow p-5">
            <h2 className="text-base font-semibold text-primary-dark font-[family-name:var(--font-manrope)] mb-4">
              Notes internes
            </h2>
            <div className="space-y-4">
              {notes.map((n, i) => (
                <div key={i} className={i > 0 ? "pt-4 border-t-0" : ""}>
                  <div
                    className={`p-3 rounded-md ${i % 2 === 0 ? "bg-surface" : "bg-surface-low"}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-on-background">
                        {n.author}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {n.date}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {n.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-surface-card rounded-md editorial-shadow p-5">
            <h2 className="text-base font-semibold text-primary-dark font-[family-name:var(--font-manrope)] mb-3">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-low px-3 py-1 text-xs text-on-surface-variant"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
