"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import Image from "next/image";
import {
  LayoutGrid,
  List,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  Plus,
  Ticket,
  Eye,
  MoreVertical,
  Search,
  Crown,
  Music,
  Sparkles,
  Copy,
  Pencil,
  Trash2,
  X,
  Save,
  ArrowLeft,
  DollarSign,
  BarChart3,
  UserCheck,
  Upload,
  Check,
  Images as ImageIcon,
  Wine,
  Mic2,
  Headphones,
  PartyPopper,
  Star,
  Flame,
  Heart,
  Zap,
  Sun,
  Moon,
  Palmtree,
} from "lucide-react";

type ViewMode = "grid" | "list" | "calendar";
type EventStatus = "Ouvert" | "Bientôt complet" | "Fermé" | "Brouillon";
type Panel = "none" | "view" | "edit" | "create";

const GRADIENTS = [
  "from-purple-600 to-indigo-900",
  "from-blue-600 to-blue-900",
  "from-emerald-600 to-teal-900",
  "from-slate-600 to-slate-900",
  "from-amber-600 to-orange-900",
  "from-rose-600 to-pink-900",
  "from-cyan-600 to-sky-900",
  "from-fuchsia-600 to-purple-900",
];

const ICONS = [Sparkles, Music, Crown, Wine, Mic2, Headphones, PartyPopper, Star, Flame, Heart, Zap, Sun, Moon, Palmtree];

const HOURS = [
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
  "03:00", "03:30", "04:00", "04:30", "05:00", "05:30",
  "06:00", "06:30", "07:00",
];

const ICON_LABELS = [
  "Sparkles", "Musique", "Couronne", "Cocktail", "Micro", "Casque",
  "Fête", "Étoile", "Flamme", "Coeur", "Éclair", "Soleil", "Lune", "Palmier",
];

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const MONTH_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_SHORT_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

interface DemoEvent {
  id: number;
  title: string;
  venue: string;
  date: string;
  dateObj?: { day: number; month: number; year: number };
  time: string;
  status: EventStatus;
  genre: string[];
  gradient: string;
  iconIdx: number;
  coverImage: string | null;
  spots: number;
  totalSpots: number;
  reservations: number;
  revenue: string;
  rpCount: number;
  closed: boolean;
  description: string;
}

/* Ligne venue_events ↔ DemoEvent. La forme client reste celle de l'UI
   existante ; seule la couche de stockage change (base au lieu de démo). */
type EventRow = {
  id: number;
  title: string;
  venue: string;
  event_day: number | null;
  event_month: number | null;
  event_year: number | null;
  time_range: string;
  status: EventStatus;
  genres: string[];
  gradient: string;
  icon_idx: number;
  cover_image: string | null;
  total_spots: number;
  spots: number;
  reservations: number;
  revenue: string;
  rp_count: number;
  closed: boolean;
  description: string;
};

const EVENT_SELECT =
  "id, title, venue, event_day, event_month, event_year, time_range, " +
  "status, genres, gradient, icon_idx, cover_image, total_spots, spots, " +
  "reservations, revenue, rp_count, closed, description";

function rowToEvent(r: EventRow): DemoEvent {
  const dateObj =
    r.event_day != null && r.event_month != null && r.event_year != null
      ? { day: r.event_day, month: r.event_month, year: r.event_year }
      : undefined;
  return {
    id: r.id,
    title: r.title,
    venue: r.venue,
    date: dateObj ? formatDateObj(dateObj) : "",
    dateObj,
    time: r.time_range,
    status: r.status,
    genre: r.genres,
    gradient: r.gradient || GRADIENTS[0],
    iconIdx: r.icon_idx,
    coverImage: r.cover_image,
    spots: r.spots,
    totalSpots: r.total_spots,
    reservations: r.reservations,
    revenue: r.revenue,
    rpCount: r.rp_count,
    closed: r.closed,
    description: r.description,
  };
}

function eventToRow(e: Omit<DemoEvent, "id">): Omit<EventRow, "id"> {
  return {
    title: e.title,
    venue: e.venue,
    event_day: e.dateObj?.day ?? null,
    event_month: e.dateObj?.month ?? null,
    event_year: e.dateObj?.year ?? null,
    time_range: e.time,
    status: e.status,
    genres: e.genre,
    gradient: e.gradient,
    icon_idx: e.iconIdx,
    cover_image: e.coverImage,
    total_spots: e.totalSpots,
    spots: e.spots,
    reservations: e.reservations,
    revenue: e.revenue,
    rp_count: e.rpCount,
    closed: e.closed,
    description: e.description,
  };
}

function statusBadge(status: EventStatus) {
  switch (status) {
    case "Ouvert": return "bg-green-400/15 text-green-400 border border-green-400/20";
    case "Bientôt complet": return "bg-amber-400/15 text-amber-400 border border-amber-400/20";
    case "Fermé": return "bg-white/[0.06] text-white/30 border border-white/10";
    case "Brouillon": return "bg-blue-400/10 text-blue-400/60 border border-blue-400/15";
  }
}

/* ── Form types ── */
interface FormState {
  title: string;
  venue: string;
  dateObj: { day: number; month: number; year: number } | null;
  timeOpen: string;
  timeClose: string;
  status: "Brouillon" | "Ouvert";
  genre: string;
  totalSpots: number;
  description: string;
  gradient: string;
  iconIdx: number;
  coverImage: string | null;
}

/* Banque d'images Unsplash. Les identifiants sont ceux de photos réelles
   (chacun vérifié en HTTP 200) servies par le CDN images.unsplash.com, déjà
   autorisé dans next.config.ts. Pas d'appel d'API : la recherche Unsplash
   exigerait une clé d'application, absente du projet. Ajouter une entrée ici
   suffit à enrichir la galerie. */
const UNSPLASH_PHOTOS: { id: string; alt: string }[] = [
  { id: "photo-1493225457124-a3eb161ffa5f", alt: "Club, jeux de lumière" },
  { id: "photo-1516450360452-9312f5e86fc7", alt: "Foule en concert" },
  { id: "photo-1519671482749-fd09be7ccebf", alt: "Scène et public" },
  { id: "photo-1424298397478-4bd87a6a0f0c", alt: "DJ aux platines" },
  { id: "photo-1470224114660-3f6686c562eb", alt: "Set DJ en soirée" },
  { id: "photo-1555396273-367ea4eb4db5", alt: "Ambiance de club" },
  { id: "photo-1514933651103-005eec06c04b", alt: "Bar de nuit" },
  { id: "photo-1566737236500-c8ac43014a67", alt: "Cocktails au bar" },
  { id: "photo-1533174072545-7a4b6ad7a6c3", alt: "Cocktail signature" },
  { id: "photo-1492684223066-81342ee5ff30", alt: "Confettis et fête" },
  { id: "photo-1530103862676-de8c9debad1d", alt: "Soirée dansante" },
  { id: "photo-1544148103-0773bf10d330", alt: "Célébration" },
  { id: "photo-1517457373958-b7bdd4587205", alt: "Dîner entre convives" },
  { id: "photo-1528605248644-14dd04022da1", alt: "Table dressée" },
  { id: "photo-1414235077428-338989a2e8c0", alt: "Salle gastronomique" },
  { id: "photo-1517248135467-4c7edcad34c4", alt: "Restaurant chaleureux" },
  { id: "photo-1552566626-52f8b828add9", alt: "Intérieur de restaurant" },
  { id: "photo-1559339352-11d035aa65de", alt: "Service en salle" },
  { id: "photo-1592861956120-e524fc739696", alt: "Terrasse" },
  { id: "photo-1551632436-cbf8dd35adfa", alt: "Rooftop au crépuscule" },
  { id: "photo-1574391884720-bbc3740c59d1", alt: "Piscine et transats" },
  { id: "photo-1470337458703-46ad1756a187", alt: "Verre au comptoir" },
];

/* Vignette légère pour la grille, rendu large pour la couverture retenue. */
const unsplashThumb = (id: string) =>
  `https://images.unsplash.com/${id}?q=60&w=240&h=160&auto=format&fit=crop`;
const unsplashFull = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=1600&auto=format&fit=crop`;

function parseTime(time: string): { open: string; close: string } {
  const parts = time.split(" - ");
  return { open: parts[0] || "", close: parts[1] || "" };
}

function emptyForm(): FormState {
  return {
    title: "", venue: "",
    dateObj: null,
    timeOpen: "", timeClose: "",
    status: "Brouillon",
    genre: "", totalSpots: 100, description: "",
    gradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
    iconIdx: Math.floor(Math.random() * ICONS.length),
    coverImage: null,
  };
}

function eventToForm(ev: DemoEvent): FormState {
  const { open, close } = parseTime(ev.time);
  return {
    title: ev.title, venue: ev.venue,
    dateObj: ev.dateObj ?? null,
    timeOpen: open, timeClose: close,
    status: (ev.status === "Brouillon" || ev.status === "Ouvert") ? ev.status : "Ouvert",
    genre: ev.genre.join(", "),
    totalSpots: ev.totalSpots, description: ev.description,
    gradient: ev.gradient, iconIdx: ev.iconIdx,
    coverImage: ev.coverImage,
  };
}

function formatDateObj(d: { day: number; month: number; year: number } | null): string {
  if (!d) return "";
  const date = new Date(d.year, d.month, d.day);
  return `${DAY_SHORT_FR[date.getDay()]} ${d.day} ${MONTH_SHORT[d.month]}`;
}

/* ── Mini Calendar Component ── */
function MiniCalendar({ selected, onSelect }: {
  selected: { day: number; month: number; year: number } | null;
  onSelect: (d: { day: number; month: number; year: number }) => void;
}) {
  const today = new Date();
  const [month, setMonth] = useState(selected?.month ?? today.getMonth());
  const [year, setYear] = useState(selected?.year ?? today.getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08] transition-all">
          <ChevronLeft size={14} strokeWidth={1.5} />
        </button>
        <span className="text-xs font-medium text-white/70">{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMonth} className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08] transition-all">
          <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[0.5rem] text-white/20 font-medium py-0.5">{d.charAt(0)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const isSelected = selected && selected.day === day && selected.month === month && selected.year === year;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <button
              key={idx}
              onClick={() => onSelect({ day, month, year })}
              className={`h-7 w-full rounded-lg text-[0.6875rem] font-medium transition-all ${
                isSelected
                  ? "bg-blue-500 text-white"
                  : isToday
                    ? "bg-white/[0.08] text-blue-400"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Component ── */

export default function EventsPage() {
  const { isLoading } = useAuthUser();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("none");
  const [panelEventId, setPanelEventId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [calMonth, setCalMonth] = useState(9);
  const [calYear, setCalYear] = useState(2022);
  const [openDropdownOpen, setOpenDropdownOpen] = useState(false);
  const [closeDropdownOpen, setCloseDropdownOpen] = useState(false);
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  /* Événements chargés depuis venue_events — la RLS les limite au compte.
     Fini le décor : ce que vous créez est enregistré et réapparaît. */
  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("venue_events")
      .select(EVENT_SELECT)
      .order("event_year", { ascending: true })
      .order("event_month", { ascending: true })
      .order("event_day", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setEvents(((data as unknown as EventRow[] | null) ?? []).map(rowToEvent));
        setEventsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Compteurs vivants : les réservations QR du jour de l'événement.
     reservations/revenue de venue_events ne sont plus des chiffres saisis
     mais dérivés du réel. */
  const [qrRows, setQrRows] = useState<
    { reservation_date: string; party_size: number; amount_spent: number | null; status: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("qr_reservations")
      .select("reservation_date, party_size, amount_spent, status")
      .neq("status", "annulée")
      .then(({ data }) => {
        if (!cancelled) setQrRows(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const withLiveCounts = (e: DemoEvent): DemoEvent => {
    if (!e.dateObj) return e;
    const iso = `${e.dateObj.year}-${String(e.dateObj.month + 1).padStart(2, "0")}-${String(e.dateObj.day).padStart(2, "0")}`;
    const rows = qrRows.filter((r) => r.reservation_date === iso);
    if (rows.length === 0) return e;
    const covers = rows.reduce((sum, r) => sum + r.party_size, 0);
    const revenue = rows.reduce((sum, r) => sum + (r.amount_spent ?? 0), 0);
    return {
      ...e,
      reservations: rows.length,
      spots: Math.max(0, e.totalSpots - covers),
      revenue: `${revenue.toLocaleString()} MAD`,
    };
  };

  const displayEvents = events.map(withLiveCounts);

  const filteredEvents = displayEvents.filter((e) => {
    if (filterStatus) {
      if (filterStatus === "Ouvert" && e.status !== "Ouvert" && e.status !== "Bientôt complet") return false;
      if (filterStatus === "Fermé" && e.status !== "Fermé") return false;
      if (filterStatus === "Brouillon" && e.status !== "Brouillon") return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !e.venue.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalReservations = displayEvents.reduce((sum, e) => sum + e.reservations, 0);
  const activeEvents = displayEvents.filter((e) => e.status === "Ouvert" || e.status === "Bientôt complet").length;
  const totalRp = displayEvents.reduce((sum, e) => sum + e.rpCount, 0);
  const avgFill = displayEvents.filter((e) => !e.closed).length > 0
    ? Math.round(displayEvents.filter((e) => !e.closed).reduce((sum, e) => sum + ((e.totalSpots - e.spots) / e.totalSpots) * 100, 0) / displayEvents.filter((e) => !e.closed).length)
    : 0;

  /* ── Panel actions ── */
  const openView = (id: number) => { setPanelEventId(id); setPanel("view"); setOpenMenu(null); };
  const openEdit = (id: number) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setForm(eventToForm(ev)); setPanelEventId(id); setPanel("edit"); setOpenMenu(null);
  };
  const openCreate = () => { setForm(emptyForm()); setPanelEventId(null); setPanel("create"); };
  const closePanel = () => { setPanel("none"); setPanelEventId(null); setOpenDropdownOpen(false); setCloseDropdownOpen(false); setIconDropdownOpen(false); setGalleryOpen(false); };

  const duplicateEvent = async (id: number) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setOpenMenu(null);
    const copy = { ...ev, title: `${ev.title} (copie)`, status: "Brouillon" as EventStatus, reservations: 0, spots: ev.totalSpots, revenue: "0 MAD", rpCount: 0, closed: false };
    const { data, error } = await createClient()
      .from("venue_events")
      .insert(eventToRow(copy))
      .select(EVENT_SELECT)
      .single();
    if (error || !data) {
      showToast("Impossible de dupliquer");
      return;
    }
    setEvents((prev) => [...prev, rowToEvent(data as unknown as EventRow)]);
    showToast(`"${ev.title}" dupliqué`);
  };

  const deleteEvent = async (id: number) => {
    const ev = events.find((e) => e.id === id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (panelEventId === id) closePanel();
    setOpenMenu(null);
    const { error } = await createClient()
      .from("venue_events")
      .delete()
      .eq("id", id);
    if (error) showToast("Échec de la suppression");
    else showToast(`"${ev?.title}" supprimé`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm({ ...form, coverImage: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const saveForm = async () => {
    if (!form.title.trim()) return;
    const genres = form.genre.split(",").map((g) => g.trim()).filter(Boolean);
    const dateStr = formatDateObj(form.dateObj);
    const timeStr = form.timeOpen && form.timeClose ? `${form.timeOpen} - ${form.timeClose}` : form.timeOpen || "";

    if (panel === "create") {
      const draft: Omit<DemoEvent, "id"> = {
        title: form.title, venue: form.venue,
        date: dateStr, dateObj: form.dateObj ?? undefined,
        time: timeStr, status: form.status, genre: genres,
        gradient: form.gradient, iconIdx: form.iconIdx, coverImage: form.coverImage,
        spots: form.totalSpots, totalSpots: form.totalSpots,
        reservations: 0, revenue: "0 MAD", rpCount: 0, closed: false,
        description: form.description,
      };
      const { data, error } = await createClient()
        .from("venue_events")
        .insert(eventToRow(draft))
        .select(EVENT_SELECT)
        .single();
      if (error || !data) {
        showToast("Impossible de créer l'événement");
        return;
      }
      setEvents((prev) => [...prev, rowToEvent(data as unknown as EventRow)]);
      showToast(`"${form.title}" créé`);
    } else if (panel === "edit" && panelEventId !== null) {
      const existing = events.find((e) => e.id === panelEventId);
      if (!existing) return;
      const updated: DemoEvent = {
        ...existing, title: form.title, venue: form.venue,
        date: dateStr || existing.date, dateObj: form.dateObj ?? existing.dateObj,
        time: timeStr || existing.time, status: form.status,
        genre: genres, totalSpots: form.totalSpots,
        spots: Math.max(0, form.totalSpots - existing.reservations),
        description: form.description, gradient: form.gradient,
        iconIdx: form.iconIdx, coverImage: form.coverImage,
        closed: false,
      };
      const { error } = await createClient()
        .from("venue_events")
        .update(eventToRow(updated))
        .eq("id", panelEventId);
      if (error) {
        showToast("Impossible d'enregistrer les modifications");
        return;
      }
      setEvents((prev) => prev.map((e) => (e.id === panelEventId ? updated : e)));
      showToast(`"${form.title}" mis à jour`);
    }
    closePanel();
  };

  /* ── Calendar helpers ── */
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const eventsOnDay = (day: number) =>
    displayEvents.filter((ev) => {
      if (ev.dateObj) return ev.dateObj.day === day && ev.dateObj.month === calMonth && ev.dateObj.year === calYear;
      return false;
    });

  const viewButtons: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: "grid", icon: LayoutGrid, label: "Grille" },
    { mode: "list", icon: List, label: "Liste" },
    { mode: "calendar", icon: Calendar, label: "Calendrier" },
  ];

  if (isLoading || !eventsLoaded) return <DashboardSkeleton />;

  const panelEvent = panelEventId !== null ? events.find((e) => e.id === panelEventId) : null;
  const PanelIcon = panelEvent ? ICONS[panelEvent.iconIdx] ?? Sparkles : Sparkles;

  const renderPanel = () => {
    if (panel === "none") return null;

    /* ── View Panel ── */
    if (panel === "view" && panelEvent) {
      const fillPercent = Math.round(((panelEvent.totalSpots - panelEvent.spots) / panelEvent.totalSpots) * 100);
      return (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePanel} />
          <div className="relative z-10 w-full max-w-lg h-full overflow-y-auto backdrop-blur-xl bg-[#0e0e1a]/95 border-l border-white/[0.1] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={closePanel} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                <ArrowLeft size={16} strokeWidth={1.5} /> Retour
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(panelEvent.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/20 rounded-lg text-xs font-medium text-blue-400 transition-all">
                  <Pencil size={12} strokeWidth={1.5} /> Modifier
                </button>
                <button onClick={closePanel} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08] transition-all">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="relative h-40 rounded-2xl overflow-hidden">
              {panelEvent.coverImage ? (
                <>
                  <Image src={panelEvent.coverImage} alt={panelEvent.title} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${panelEvent.gradient}`}>
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
                  <PanelIcon size={100} strokeWidth={0.5} className="absolute bottom-2 right-4 text-white/[0.08]" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className={`text-[0.625rem] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${statusBadge(panelEvent.status)}`}>{panelEvent.status}</span>
              </div>
              <div className="absolute bottom-4 left-4 z-10">
                <h2 className="text-2xl font-bold text-white">{panelEvent.title}</h2>
                <p className="text-sm text-white/60 flex items-center gap-1 mt-1"><MapPin size={12} strokeWidth={1.5} />{panelEvent.venue}</p>
              </div>
            </div>

            {panelEvent.description && <p className="text-sm text-white/50 leading-relaxed">{panelEvent.description}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1"><Clock size={13} strokeWidth={1.5} className="text-white/25" /><p className="text-[0.625rem] text-white/30 uppercase tracking-wider">Date & Heure</p></div>
                <p className="text-sm font-medium text-white">{panelEvent.date}</p>
                <p className="text-xs text-white/40">{panelEvent.time}</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1"><Users size={13} strokeWidth={1.5} className="text-white/25" /><p className="text-[0.625rem] text-white/30 uppercase tracking-wider">Capacité</p></div>
                <p className="text-sm font-medium text-white">{panelEvent.totalSpots} places</p>
                <p className="text-xs text-white/40">{panelEvent.spots} disponibles</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1"><UserCheck size={13} strokeWidth={1.5} className="text-white/25" /><p className="text-[0.625rem] text-white/30 uppercase tracking-wider">RP Actifs</p></div>
                <p className="text-sm font-medium text-white">{panelEvent.rpCount}</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1"><DollarSign size={13} strokeWidth={1.5} className="text-white/25" /><p className="text-[0.625rem] text-white/30 uppercase tracking-wider">CA</p></div>
                <p className="text-sm font-medium text-white">{panelEvent.revenue}</p>
              </div>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><BarChart3 size={13} strokeWidth={1.5} className="text-white/25" /><span className="text-[0.625rem] text-white/30 uppercase tracking-wider">Remplissage</span></div>
                <span className="text-sm font-semibold text-white">{fillPercent}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${fillPercent >= 90 ? "bg-amber-400" : fillPercent >= 50 ? "bg-blue-400" : "bg-white/20"}`} style={{ width: `${fillPercent}%` }} />
              </div>
              <p className="text-xs text-white/25 mt-1.5">{panelEvent.reservations} réservations sur {panelEvent.totalSpots}</p>
            </div>

            <div>
              <p className="text-[0.625rem] text-white/30 uppercase tracking-wider mb-2">Genres</p>
              <div className="flex flex-wrap gap-2">
                {panelEvent.genre.map((g) => (
                  <span key={g} className="text-xs font-medium bg-white/[0.06] border border-white/[0.08] text-white/60 px-3 py-1 rounded-full">{g}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ── Create / Edit Panel ── */
    if (panel === "create" || panel === "edit") {
      const isEdit = panel === "edit";
      const FormIcon = ICONS[form.iconIdx] ?? Sparkles;
      return (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePanel} />
          <div className="relative z-10 w-full max-w-lg h-full overflow-y-auto backdrop-blur-xl bg-[#0e0e1a]/95 border-l border-white/[0.1] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isEdit ? "Modifier l'événement" : "Nouvel événement"}
                </h2>
                <p className="text-xs text-white/30 mt-0.5">{isEdit ? "Modifiez les détails" : "Remplissez les informations"}</p>
              </div>
              <button onClick={closePanel} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08] transition-all">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Cover image / gradient preview */}
            <div className="relative h-36 rounded-2xl overflow-hidden group">
              {form.coverImage ? (
                <>
                  <Image src={form.coverImage} alt="Cover" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${form.gradient}`}>
                  <FormIcon size={70} strokeWidth={0.5} className="absolute bottom-2 right-4 text-white/[0.08]" />
                </div>
              )}
              {form.title && (
                <div className="absolute bottom-3 left-4 z-10">
                  <p className="text-lg font-bold text-white font-ui">{form.title}</p>
                </div>
              )}
              {/* Upload overlay */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/0 group-hover:bg-black/40 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {form.coverImage ? <Pencil size={18} strokeWidth={1.5} className="text-white" /> : <Upload size={18} strokeWidth={1.5} className="text-white" />}
                </div>
                <span className="text-xs font-medium text-white/80">{form.coverImage ? "Changer l'image" : "Importer une image"}</span>
              </div>
              {form.coverImage && (
                <button
                  onClick={(e) => { e.stopPropagation(); setForm({ ...form, coverImage: null }); }}
                  className="absolute top-2 right-2 z-30 p-1 rounded-lg bg-black/40 text-white/70 hover:text-white hover:bg-red-500/40 transition-all"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* Deux voies explicites vers une couverture. En boutons et non en
                survol de l'aperçu : ce dernier n'existe pas au toucher. */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.06] px-3 py-2.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
              >
                <Upload size={14} strokeWidth={1.5} />
                Importer une image
              </button>
              <button
                onClick={() => setGalleryOpen((v) => !v)}
                aria-expanded={galleryOpen}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                  galleryOpen
                    ? "border-blue-400/30 bg-blue-500/20 text-blue-300"
                    : "border-white/[0.12] bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white"
                }`}
              >
                <ImageIcon size={14} strokeWidth={1.5} />
                Photo Unsplash
              </button>
            </div>

            {galleryOpen && (
              <div className="rounded-2xl border border-white/[0.12] bg-black/30 p-3">
                <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto scrollbar-thin">
                  {UNSPLASH_PHOTOS.map((photo) => {
                    const full = unsplashFull(photo.id);
                    const active = form.coverImage === full;
                    return (
                      <button
                        key={photo.id}
                        onClick={() => setForm({ ...form, coverImage: full })}
                        title={photo.alt}
                        aria-label={photo.alt}
                        aria-pressed={active}
                        className={`relative aspect-[3/2] overflow-hidden rounded-lg border transition-all ${
                          active
                            ? "border-blue-400 ring-2 ring-blue-400/40"
                            : "border-white/10 hover:border-white/40"
                        }`}
                      >
                        <Image
                          src={unsplashThumb(photo.id)}
                          alt={photo.alt}
                          fill
                          sizes="120px"
                          className="object-cover"
                          unoptimized
                        />
                        {active && (
                          <span className="absolute inset-0 flex items-center justify-center bg-blue-500/30">
                            <Check size={16} strokeWidth={2.5} className="text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Crédit : Unsplash demande d'attribuer la source. */}
                <p className="mt-2.5 text-[10px] text-white/30">
                  Photos{" "}
                  <a
                    href="https://unsplash.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-white/60"
                  >
                    Unsplash
                  </a>
                  , libres d&apos;utilisation.
                </p>
              </div>
            )}

            {/* Gradient picker (hidden if cover image) */}
            {!form.coverImage && (
              <div>
                <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-2">Couleur de fond</label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENTS.map((g) => (
                    <button key={g} onClick={() => setForm({ ...form, gradient: g })} className={`w-7 h-7 rounded-lg bg-gradient-to-br ${g} border-2 transition-all ${form.gradient === g ? "border-blue-400 scale-110" : "border-transparent hover:scale-105"}`} />
                  ))}
                </div>
              </div>
            )}

            {/* Icon dropdown */}
            <div>
              <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-2">Icône</label>
              <div className="relative">
                <button
                  onClick={() => setIconDropdownOpen(!iconDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white hover:border-white/[0.15] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {(() => { const Ic = ICONS[form.iconIdx] ?? Sparkles; return <Ic size={16} strokeWidth={1.5} className="text-blue-400" />; })()}
                    <span className="text-white/70">{ICON_LABELS[form.iconIdx] ?? "Icône"}</span>
                  </div>
                  <ChevronDown size={14} strokeWidth={1.5} className="text-white/30" />
                </button>
                {iconDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIconDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 z-40 backdrop-blur-xl bg-[#1a1a2e] border border-white/15 rounded-xl p-1.5 shadow-xl max-h-[240px] overflow-y-auto scrollbar-thin">
                      {ICONS.map((Ic, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setForm({ ...form, iconIdx: idx }); setIconDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/10 ${form.iconIdx === idx ? "bg-white/[0.08] text-blue-400" : "text-white/60"}`}
                        >
                          <Ic size={16} strokeWidth={1.5} className={form.iconIdx === idx ? "text-blue-400" : "text-white/30"} />
                          {ICON_LABELS[idx]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div>
                <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Nom *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Gala de Minuit"
                  className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors" />
              </div>

              <div>
                <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Lieu</label>
                <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Ex: Maison Dorée"
                  className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors" />
              </div>

              {/* Date - mini calendar */}
              <div>
                <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Date</label>
                {form.dateObj && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-white bg-white/[0.06] px-3 py-1 rounded-lg">{formatDateObj(form.dateObj)}</span>
                    <button onClick={() => setForm({ ...form, dateObj: null })} className="text-white/30 hover:text-red-400 transition-colors"><X size={14} strokeWidth={1.5} /></button>
                  </div>
                )}
                <MiniCalendar selected={form.dateObj} onSelect={(d) => setForm({ ...form, dateObj: d })} />
              </div>

              {/* Time dropdowns - Ouverture / Fermeture */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Ouverture</label>
                  <div className="relative">
                    <button
                      onClick={() => { setOpenDropdownOpen(!openDropdownOpen); setCloseDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white hover:border-white/[0.15] transition-colors"
                    >
                      <span className={form.timeOpen ? "text-white" : "text-white/20"}>{form.timeOpen || "-- : --"}</span>
                      <ChevronDown size={14} strokeWidth={1.5} className="text-white/30" />
                    </button>
                    {openDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setOpenDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 z-40 backdrop-blur-xl bg-[#1a1a2e] border border-white/15 rounded-xl p-1 shadow-xl max-h-[180px] overflow-y-auto scrollbar-thin">
                          {HOURS.map((h) => (
                            <button key={h} onClick={() => { setForm({ ...form, timeOpen: h }); setOpenDropdownOpen(false); }}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/10 ${form.timeOpen === h ? "bg-white/[0.08] text-blue-400" : "text-white/60"}`}>
                              {h}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Fermeture</label>
                  <div className="relative">
                    <button
                      onClick={() => { setCloseDropdownOpen(!closeDropdownOpen); setOpenDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white hover:border-white/[0.15] transition-colors"
                    >
                      <span className={form.timeClose ? "text-white" : "text-white/20"}>{form.timeClose || "-- : --"}</span>
                      <ChevronDown size={14} strokeWidth={1.5} className="text-white/30" />
                    </button>
                    {closeDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setCloseDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 z-40 backdrop-blur-xl bg-[#1a1a2e] border border-white/15 rounded-xl p-1 shadow-xl max-h-[180px] overflow-y-auto scrollbar-thin">
                          {HOURS.map((h) => (
                            <button key={h} onClick={() => { setForm({ ...form, timeClose: h }); setCloseDropdownOpen(false); }}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/10 ${form.timeClose === h ? "bg-white/[0.08] text-blue-400" : "text-white/60"}`}>
                              {h}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Statut</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setForm({ ...form, status: "Brouillon" })}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${form.status === "Brouillon" ? "bg-blue-400/15 border-blue-400/30 text-blue-400" : "bg-white/[0.04] border-white/[0.08] text-white/30 hover:text-white/50"}`}
                    >
                      Brouillon
                    </button>
                    <button
                      onClick={() => setForm({ ...form, status: "Ouvert" })}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${form.status === "Ouvert" ? "bg-green-400/15 border-green-400/30 text-green-400" : "bg-white/[0.04] border-white/[0.08] text-white/30 hover:text-white/50"}`}
                    >
                      Ouvert
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Capacité</label>
                  <input type="number" value={form.totalSpots} onChange={(e) => setForm({ ...form, totalSpots: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-blue-400/40 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Genres (virgule)</label>
                <input type="text" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Ex: Electro, House"
                  className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors" />
              </div>

              <div>
                <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Décrivez votre événement..." rows={3}
                  className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors resize-none" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 pb-6">
              <button onClick={closePanel} className="flex-1 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all">
                Annuler
              </button>
              <button onClick={saveForm} disabled={!form.title.trim()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-30 disabled:hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)]">
                <Save size={15} strokeWidth={1.5} />
                {isEdit ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Événements</h1>
            <p className="text-white/50 text-sm mt-1">Gérez et planifiez vos événements</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl overflow-hidden border border-white/[0.12]">
              {viewButtons.map(({ mode, icon: Icon, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 transition-all ${viewMode === mode ? "bg-blue-500 text-white" : "bg-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.08]"}`}>
                  <Icon size={14} strokeWidth={1.5} /><span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:shadow-[0_0_30px_rgba(96,165,250,0.3)]">
              <Plus size={16} strokeWidth={2} /> Créer
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {displayEvents.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">Événements actifs</p>
            <p className="text-xl font-bold text-white mt-1 font-ui">{activeEvents}</p>
          </div>
          <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">Réservations totales</p>
            <p className="text-xl font-bold text-blue-400 mt-1 font-ui">{totalReservations}</p>
          </div>
          <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">RP mobilisés</p>
            <p className="text-xl font-bold text-white mt-1 font-ui">{totalRp}</p>
          </div>
          <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">Taux de remplissage moy.</p>
            <p className="text-xl font-bold text-green-400 mt-1 font-ui">{avgFill}%</p>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" placeholder="Rechercher un événement..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400/40 transition-colors" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="appearance-none pl-4 pr-9 py-2.5 backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-xl text-sm text-white/70 focus:outline-none focus:border-blue-400/40 transition-colors cursor-pointer">
            <option value="" className="bg-[#1a1a2e]">Tous les statuts</option>
            <option value="Ouvert" className="bg-[#1a1a2e]">Ouvert</option>
            <option value="Fermé" className="bg-[#1a1a2e]">Fermé</option>
            <option value="Brouillon" className="bg-[#1a1a2e]">Brouillon</option>
          </select>
          <ChevronDown size={13} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* ── Content ── */}
      {filteredEvents.length === 0 && viewMode !== "calendar" ? (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-12 text-center">
          <Ticket size={36} strokeWidth={1} className="mx-auto text-white/15 mb-3" />
          <p className="text-sm text-white/30">Aucun événement trouvé</p>
        </div>
      ) : viewMode === "calendar" ? (
        /* ── Calendar view ── */
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <h2 className="text-lg font-semibold text-white">{MONTH_NAMES[calMonth]} {calYear}</h2>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-white/[0.06]">
            {DAY_NAMES.map((d) => (
              <div key={d} className="px-2 py-2.5 text-center text-[0.6875rem] text-white/25 uppercase tracking-wider font-semibold">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayEvents = day ? eventsOnDay(day) : [];
              return (
                <div key={idx} className={`min-h-[100px] md:min-h-[120px] border-b border-r border-white/[0.04] p-1.5 ${day ? "hover:bg-white/[0.02]" : "bg-white/[0.01]"} transition-colors`}>
                  {day && (
                    <>
                      <p className={`text-xs font-medium mb-1 px-1 ${dayEvents.length > 0 ? "text-white/70" : "text-white/20"}`}>{day}</p>
                      <div className="space-y-1">
                        {dayEvents.map((ev) => (
                          <button key={ev.id} onClick={() => openView(ev.id)} className={`w-full text-left px-1.5 py-1 rounded-lg bg-gradient-to-r ${ev.gradient} text-[0.5625rem] font-medium text-white/90 truncate hover:opacity-80 transition-opacity`}>
                            {ev.title}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === "list" ? (
        /* ── List view ── */
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.08] text-[0.6875rem] text-white/30 uppercase tracking-wider font-semibold">
            <div className="col-span-4">Événement</div>
            <div className="col-span-2 hidden md:block">Date & Heure</div>
            <div className="col-span-1 hidden lg:block text-center">RP</div>
            <div className="col-span-2 hidden md:block">Remplissage</div>
            <div className="col-span-1 hidden lg:block text-right">CA</div>
            <div className="col-span-1 text-center">Statut</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          {filteredEvents.map((event) => {
            const fillPercent = Math.round(((event.totalSpots - event.spots) / event.totalSpots) * 100);
            const Icon = ICONS[event.iconIdx] ?? Sparkles;
            return (
              <div key={event.id} className={`grid grid-cols-12 gap-4 px-5 py-4 border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors items-center ${event.closed ? "opacity-50" : ""}`}>
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden relative ${!event.coverImage ? `bg-gradient-to-br ${event.gradient}` : ""}`} onClick={() => openView(event.id)}>
                    {event.coverImage ? <Image src={event.coverImage} alt="" fill className="object-cover" unoptimized /> : <Icon size={18} strokeWidth={1.5} className="text-white/70" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate font-ui cursor-pointer hover:text-blue-400 transition-colors" onClick={() => openView(event.id)}>{event.title}</p>
                    <p className="text-[0.6875rem] text-white/35 flex items-center gap-1 truncate"><MapPin size={10} strokeWidth={1.5} />{event.venue}</p>
                  </div>
                </div>
                <div className="col-span-2 hidden md:flex items-center gap-1.5 text-xs text-white/50">
                  <Clock size={12} strokeWidth={1.5} className="text-white/25" />
                  <div><p>{event.date}</p><p className="text-white/25">{event.time}</p></div>
                </div>
                <div className="col-span-1 hidden lg:flex items-center justify-center"><span className="text-sm text-white/60 font-medium">{event.rpCount}</span></div>
                <div className="col-span-2 hidden md:block">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${fillPercent >= 90 ? "bg-amber-400" : fillPercent >= 50 ? "bg-blue-400" : "bg-white/20"}`} style={{ width: `${fillPercent}%` }} />
                    </div>
                    <span className="text-xs text-white/40 w-8 text-right">{fillPercent}%</span>
                  </div>
                  <p className="text-[0.625rem] text-white/25 mt-0.5">{event.reservations}/{event.totalSpots}</p>
                </div>
                <div className="col-span-1 hidden lg:block text-right"><p className="text-sm font-medium text-white/60">{event.revenue}</p></div>
                <div className="col-span-1 flex justify-center">
                  <span className={`text-[0.625rem] font-semibold px-2 py-0.5 rounded-full ${statusBadge(event.status)}`}>{event.status}</span>
                </div>
                <div className="col-span-1 flex justify-end relative">
                  <button onClick={() => setOpenMenu(openMenu === event.id ? null : event.id)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08] transition-all">
                    <MoreVertical size={16} strokeWidth={1.5} />
                  </button>
                  {openMenu === event.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 z-40 backdrop-blur-xl bg-[#1a1a2e] border border-white/15 rounded-xl p-1 shadow-xl min-w-[160px]">
                        <button onClick={() => openView(event.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all"><Eye size={13} strokeWidth={1.5} />Voir détails</button>
                        <button onClick={() => openEdit(event.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all"><Pencil size={13} strokeWidth={1.5} />Modifier</button>
                        <button onClick={() => duplicateEvent(event.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all"><Copy size={13} strokeWidth={1.5} />Dupliquer</button>
                        <button onClick={() => deleteEvent(event.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400/70 hover:bg-red-400/10 hover:text-red-400 transition-all"><Trash2 size={13} strokeWidth={1.5} />Supprimer</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Grid view ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const fillPercent = Math.round(((event.totalSpots - event.spots) / event.totalSpots) * 100);
            const Icon = ICONS[event.iconIdx] ?? Sparkles;
            return (
              <div key={event.id} className={`group backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl overflow-hidden hover:bg-white/[0.09] transition-all duration-300 ${event.closed ? "opacity-50" : ""}`}>
                <div className={`relative h-32 overflow-hidden cursor-pointer ${!event.coverImage ? `bg-gradient-to-br ${event.gradient}` : ""}`} onClick={() => openView(event.id)}>
                  {event.coverImage ? (
                    <>
                      <Image src={event.coverImage} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0">
                      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
                      <Icon size={80} strokeWidth={0.5} className="absolute bottom-2 right-4 text-white/[0.08]" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3"><span className={`text-[0.625rem] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${statusBadge(event.status)}`}>{event.status}</span></div>
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {event.genre.map((g) => (<span key={g} className="text-[0.5625rem] font-medium bg-black/30 backdrop-blur-sm text-white/80 px-2 py-0.5 rounded-full">{g}</span>))}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white cursor-pointer hover:text-blue-400 transition-colors" onClick={() => openView(event.id)}>{event.title}</h3>
                    <p className="text-[0.6875rem] text-white/40 flex items-center gap-1 mt-1"><MapPin size={11} strokeWidth={1.5} />{event.venue}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1"><Clock size={12} strokeWidth={1.5} className="text-white/25" />{event.date}</span>
                    <span className="text-white/15">·</span><span>{event.time}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[0.625rem] text-white/30 uppercase tracking-wider">Remplissage</span>
                      <span className="text-xs text-white/50 font-medium">{fillPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${fillPercent >= 90 ? "bg-amber-400" : fillPercent >= 50 ? "bg-blue-400" : "bg-white/20"}`} style={{ width: `${fillPercent}%` }} />
                    </div>
                    <p className="text-[0.625rem] text-white/20 mt-1">{event.reservations}/{event.totalSpots} places réservées</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.04] rounded-xl p-2.5 text-center"><p className="text-[0.5625rem] text-white/25 uppercase tracking-wider">Résa</p><p className="text-sm font-semibold text-white mt-0.5">{event.reservations}</p></div>
                    <div className="bg-white/[0.04] rounded-xl p-2.5 text-center"><p className="text-[0.5625rem] text-white/25 uppercase tracking-wider">RP</p><p className="text-sm font-semibold text-white mt-0.5">{event.rpCount}</p></div>
                    <div className="bg-white/[0.04] rounded-xl p-2.5 text-center"><p className="text-[0.5625rem] text-white/25 uppercase tracking-wider">CA</p><p className="text-[0.6875rem] font-semibold text-white mt-0.5 truncate">{event.revenue}</p></div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => openView(event.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-xs font-medium text-white/60 hover:text-white transition-all"><Eye size={13} strokeWidth={1.5} />Voir</button>
                    <button onClick={() => openEdit(event.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/20 rounded-xl text-xs font-medium text-blue-400 transition-all"><Pencil size={13} strokeWidth={1.5} />Modifier</button>
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === event.id ? null : event.id)} className="p-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-white/30 hover:text-white transition-all">
                        <MoreVertical size={14} strokeWidth={1.5} />
                      </button>
                      {openMenu === event.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 bottom-full mb-1 z-40 backdrop-blur-xl bg-[#1a1a2e] border border-white/15 rounded-xl p-1 shadow-xl min-w-[160px]">
                            <button onClick={() => duplicateEvent(event.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all"><Copy size={13} strokeWidth={1.5} />Dupliquer</button>
                            <button onClick={() => deleteEvent(event.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400/70 hover:bg-red-400/10 hover:text-red-400 transition-all"><Trash2 size={13} strokeWidth={1.5} />Supprimer</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredEvents.length > 0 && viewMode !== "calendar" && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-white/25">{filteredEvents.length} sur {displayEvents.length} événements</p>
        </div>
      )}

      {renderPanel()}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-xl">
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
