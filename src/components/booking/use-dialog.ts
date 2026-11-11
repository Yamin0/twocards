"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Comportement d'une boîte de dialogue modale, sans dépendance :
   - le focus entre dans la boîte à l'ouverture et y reste (Tab, Maj+Tab) ;
   - Échap ferme ;
   - la page derrière ne défile plus ;
   - à la fermeture, le focus revient sur l'élément qui a ouvert la boîte.
   Le conteneur doit porter `role="dialog"`, `aria-modal` et `tabIndex={-1}`. */
export function useDialog(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  /* L'élément qui a ouvert la boîte. À fournir quand on le connaît : Safari
     ne donne pas le focus à un bouton cliqué, `document.activeElement` n'y
     suffit donc pas. */
  openerRef?: RefObject<HTMLElement | null>
) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const node = ref.current;
    const opener = openerRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close.current();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (items.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!node.contains(current)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (current === first || current === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [ref, openerRef]);
}
