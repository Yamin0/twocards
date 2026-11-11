"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/* Enveloppe des pages publiques qui utilisent encore framer-motion (les
   écrans de la demande d'accès ; les pages métiers ne la chargent plus,
   leur mot tournant est animé en CSS) : avec
   reducedMotion="user", les déplacements et les flous sont retirés quand
   le visiteur a demandé moins d'animations ; seuls les fondus restent. */
export function PublicMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
