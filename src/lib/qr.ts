/* Le SVG rendu par react-qr-code est sérialisé tel quel : le fichier
   téléchargé est identique au QR affiché. */
export function downloadSvg(id: string, label: string) {
  const svg = document.getElementById(id)?.querySelector("svg");
  if (!svg) return false;
  const source = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `qr-${label.toLowerCase().replace(/\s+/g, "-")}.svg`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/* URL publique encodée dans le QR : identifie le code, et porte le nom et la
   ville de l'hôtel — le nom en secours d'affichage si la base est
   injoignable, la ville pour restreindre le catalogue à celle de l'hôtel. */
export function guestUrl(
  code: string,
  hotelName: string | null | undefined,
  city?: string | null
) {
  const params = new URLSearchParams({ h: hotelName ?? "" });
  if (city) params.set("c", city);
  return `${window.location.origin}/s/${code}?${params.toString()}`;
}
