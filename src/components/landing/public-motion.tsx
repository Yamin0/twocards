"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/* Enveloppe des pages publiques qui utilisent encore framer-motion (mot
   tournant des titres, écrans de la demande d'accès) : avec
   reducedMotion="user", les déplacements et les flous sont retirés quand
   le visiteur a demandé moins d'animations ; seuls les fondus restent. */
export function PublicMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
