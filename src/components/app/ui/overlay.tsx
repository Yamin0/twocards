"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Button, IconButton } from "./button";

/* Calques flottants : fenêtre modale, tiroir, confirmation, toasts.
   Montés sur <body> par portail pour échapper à tout ancêtre qui rogne ou
   transforme. La classe .tc-layer leur donne la typographie et l'anneau de
   focus de la coque. */

const noopSubscribe = () => () => {};

function Layer({ children }: { children: ReactNode }) {
  /* Faux côté serveur et au premier rendu client, vrai ensuite : pas
     d'écart d'hydratation. */
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/* Échap ferme, Tab reste dans le calque, le défilement de la page est
   bloqué, et le focus revient où il était à la fermeture. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    /* Premier champ s'il y en a un, sinon le calque lui-même. */
    const first = node?.querySelector<HTMLElement>("[data-autofocus]") ?? node;
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || active === node)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return ref;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const t = useT();
  const ref = useDialog(open, onClose);
  const id = useId();
  if (!open) return null;
  return (
    <Layer>
      <div className="tc-layer fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
        <div className="absolute inset-0 bg-scrim" onClick={onClose} aria-hidden />
        {/* En-tête et pied restent visibles : seul le corps défile. */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={id}
          tabIndex={-1}
          className={cn(
            "relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-panel shadow-pop outline-none animate-in fade-in slide-in-from-bottom-4 sm:rounded-2xl",
            size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl"
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
            <div className="min-w-0">
              <h2 id={id} className="text-lg font-bold text-ink">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{description}</p>
              )}
            </div>
            <IconButton icon={X} label={t("Fermer", "Close")} onClick={onClose} className="-mr-2 -mt-1" />
          </div>
          {children && (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-1 scrollbar-thin sm:px-6">
              {children}
            </div>
          )}
          {footer ? (
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
              {footer}
            </div>
          ) : (
            <div className="shrink-0 pb-4" />
          )}
        </div>
      </div>
    </Layer>
  );
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  danger = false,
  loading = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {t("Annuler", "Cancel")}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t("Confirmer", "Confirm")}
          </Button>
        </>
      }
    />
  );
}

/* Tiroir : panneau latéral sur ordinateur, feuille montante sur téléphone. */
export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useT();
  const ref = useDialog(open, onClose);
  const id = useId();
  if (!open) return null;
  return (
    <Layer>
      <div className="tc-layer fixed inset-0 z-[70] flex items-end justify-end sm:items-stretch">
        <div className="absolute inset-0 bg-scrim" onClick={onClose} aria-hidden />
        <aside
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={id}
          tabIndex={-1}
          className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-panel shadow-pop outline-none animate-in slide-in-from-bottom-4 sm:max-h-none sm:w-[460px] sm:rounded-none sm:slide-in-from-right-4"
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-5 sm:px-6">
            <div className="min-w-0">
              {eyebrow && <p className="mb-0.5 text-[13px] text-ink-3">{eyebrow}</p>}
              <h2 id={id} className="truncate text-xl font-bold text-ink">
                {title}
              </h2>
            </div>
            <IconButton icon={X} label={t("Fermer", "Close")} onClick={onClose} className="-mr-2 -mt-1" />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin sm:px-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              {footer}
            </div>
          )}
        </aside>
      </div>
    </Layer>
  );
}

/* ─── Toasts ────────────────────────────────────────────────────────────────
   Un seul fournisseur, posé par la coque. `const notify = useNotify()` puis
   `notify("Enregistré")` ou `notify("Échec", "error")`. Un toast d'erreur
   reste plus longtemps et s'annonce en assertive. */

type ToastTone = "success" | "error";
type ToastItem = { id: number; message: string; tone: ToastTone };
type Notify = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<Notify | null>(null);

function ToastView({ message, tone }: { message: string; tone: ToastTone }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex max-w-[min(92vw,26rem)] items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-pop animate-in fade-in slide-in-from-bottom-2"
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white",
          tone === "success" ? "bg-ok" : "bg-danger"
        )}
        aria-hidden
      >
        {tone === "success" ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
      </span>
      {message}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const notify = useCallback<Notify>((message, tone = "success") => {
    const id = ++seq.current;
    setItems((list) => [...list.slice(-2), { id, message, tone }]);
    setTimeout(
      () => setItems((list) => list.filter((i) => i.id !== id)),
      tone === "error" ? 6000 : 2800
    );
  }, []);
  const value = useMemo(() => notify, [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <Layer>
        <div className="tc-layer pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4">
          {items.map((i) => (
            <ToastView key={i.id} message={i.message} tone={i.tone} />
          ))}
        </div>
      </Layer>
    </ToastContext.Provider>
  );
}

/** Hors de la coque (aucun fournisseur), l'appel est sans effet. */
export function useNotify(): Notify {
  return useContext(ToastContext) ?? (() => {});
}

/** Toast piloté par un état local (`message` null = caché). Préférer useNotify. */
export function Toast({ message, tone = "success" }: { message: string | null; tone?: ToastTone }) {
  if (!message) return null;
  return (
    <Layer>
      <div className="tc-layer pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[80] flex justify-center px-4">
        <ToastView message={message} tone={tone} />
      </div>
    </Layer>
  );
}
