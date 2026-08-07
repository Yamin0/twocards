"use client";

import Image from "next/image";

/* Photo de profil de l'utilisateur, avec repli sur ses initiales tant
   qu'aucune image n'est envoyée. Partagé par les trois espaces
   (établissement, concierge, hôtel) pour que l'avatar soit identique
   partout. */
export function Avatar({
  url,
  initials,
  size,
  className = "",
  textClassName = "",
}: {
  url: string | null;
  initials: string;
  size: number;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-white/15 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image
          src={url}
          alt="Photo de profil"
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span className={textClassName}>{initials}</span>
      )}
    </div>
  );
}
