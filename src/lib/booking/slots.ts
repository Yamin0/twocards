import type { GuestCategoryKey } from "@/lib/guest-catalog";
import { addDays, isoDay } from "./dates";

/* ─── Portail direct : créneaux depuis l'amplitude configurée ────────────────
   Gère le passage de minuit (19:00 → 01:00) : les créneaux après minuit
   portent dayOffset 1. */
export type Slot = { label: string; dayOffset: 0 | 1 };

export function buildSlots(start: string, end: string, interval: number): Slot[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const step = Number.isFinite(interval) && interval > 0 ? interval : 30;
  let t = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (Number.isNaN(t) || Number.isNaN(endMin)) return [];
  if (endMin <= t) endMin += 24 * 60;
  const out: Slot[] = [];
  while (t <= endMin) {
    const h = Math.floor(t / 60) % 24;
    const m = t % 60;
    out.push({
      label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      dayOffset: t >= 24 * 60 ? 1 : 0,
    });
    t += step;
  }
  return out;
}

/* Instant réel d'un créneau pour un jour donné — un créneau « 00:30 » d'une
   amplitude 19:00 → 01:00 a lieu le lendemain matin. */
export function slotDateTime(dayIso: string, slot: Slot): Date {
  const d = new Date(`${dayIso}T${slot.label}:00`);
  if (slot.dayOffset) d.setDate(d.getDate() + 1);
  return d;
}

/** Jour d'ouverture du portail : aujourd'hui, ou demain si tous les créneaux
    du jour sont déjà passés (plutôt qu'une grille entièrement grisée). */
export function defaultPortalDate(slots: Slot[], now: Date = new Date()) {
  const today = isoDay(now);
  if (slots.length && slots.every((s) => slotDateTime(today, s) < now)) return isoDay(addDays(now, 1));
  return today;
}

/* ─── Menu QR : créneaux proposés selon la catégorie ─────────────────────────
   Un restaurant se réserve à midi et le soir, un club la nuit, une activité
   le matin et l'après-midi. */
export const GUEST_SLOTS: Record<GuestCategoryKey, string[]> = {
  restaurants: ["12:30", "13:00", "13:30", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"],
  clubs: ["22:30", "23:00", "23:30", "00:00", "00:30", "01:00"],
  activites: ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
  services: ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
};

/* Délai minimum avant un créneau proposé : l'établissement doit avoir le
   temps de répondre. */
const GUEST_LEAD_MINUTES = 30;

/* Minutes depuis minuit ; avant 5 h, l'heure appartient à la nuit qui
   précède (« 00:30 » pour ce soir). */
function nightMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return (h < 5 ? h + 24 : h) * 60 + m;
}

/** Un créneau proposé n'est plus réservable : trop proche ou déjà passé. */
export function isGuestSlotPast(dayIso: string, time: string, now: Date = new Date()) {
  if (dayIso !== isoDay(now)) return false;
  const min = nightMinutes(time);
  return min !== null && min <= now.getHours() * 60 + now.getMinutes() + GUEST_LEAD_MINUTES;
}

/** Une heure saisie librement (« Autre ») est déjà passée aujourd'hui. */
export function isGuestTimePast(dayIso: string, time: string, now: Date = new Date()) {
  if (dayIso !== isoDay(now)) return false;
  const min = nightMinutes(time);
  return min !== null && min <= now.getHours() * 60 + now.getMinutes();
}

/** Jour d'ouverture de la feuille : aujourd'hui, ou demain si plus aucun
    créneau de la catégorie n'est réservable ce soir (comme le portail). */
export function defaultGuestDate(category: GuestCategoryKey, now: Date = new Date()) {
  const today = isoDay(now);
  return GUEST_SLOTS[category].every((s) => isGuestSlotPast(today, s, now)) ? isoDay(addDays(now, 1)) : today;
}
