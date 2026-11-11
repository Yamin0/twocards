"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { isUnoptimizable } from "@/lib/booking/images";

/* next/image pour les photos venues de la base : optimisées quand l'hôte est
   déclaré (Supabase Storage), servies telles quelles sinon. Les images sont
   décoratives par défaut (`alt=""`) : le nom de l'adresse est toujours écrit
   à côté.

   Filet de sécurité : si l'optimiseur refuse ou échoue (quota, panne, réseau
   qui masque l'adresse du stockage), la photo est redemandée directement à
   sa source plutôt que de laisser un cadre vide. */
export function RemoteImage({ src, alt = "", ...props }: Omit<ImageProps, "src" | "alt"> & { src: string; alt?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const direct = failedSrc === src || isUnoptimizable(src);
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      unoptimized={direct}
      /* L'erreur a pu survenir avant l'hydratation : on la constate au montage. */
      ref={(img) => {
        if (img && !direct && img.complete && img.naturalWidth === 0 && img.currentSrc) setFailedSrc(src);
      }}
      onError={() => {
        if (!direct) setFailedSrc(src);
      }}
    />
  );
}
