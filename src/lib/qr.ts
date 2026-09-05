/* Outils autour du QR code affiché par react-qr-code : le SVG rendu est
   sérialisé tel quel, le fichier téléchargé est identique au QR affiché. */

const slug = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function svgSource(containerId: string) {
  const svg = document.getElementById(containerId)?.querySelector("svg");
  if (!svg) return null;
  return new XMLSerializer().serializeToString(svg);
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export function downloadSvg(containerId: string, label: string) {
  const source = svgSource(containerId);
  if (!source) return false;
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `qr-${slug(label)}.svg`);
  URL.revokeObjectURL(url);
  return true;
}

/* PNG haute définition (1024 px, marge blanche) pour l'imprimeur ou un
   support de communication : le SVG est rasterisé dans un canvas. */
export function downloadPng(containerId: string, label: string, size = 1024) {
  const source = svgSource(containerId);
  if (!source) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(false);
        return;
      }
      const margin = Math.round(size * 0.08);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, margin, margin, size - margin * 2, size - margin * 2);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        const pngUrl = URL.createObjectURL(blob);
        triggerDownload(pngUrl, `qr-${slug(label)}.png`);
        URL.revokeObjectURL(pngUrl);
        resolve(true);
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

/* URL publique encodée dans le QR. Le nom et la ville de l'hôtel y figurent
   en secours : le menu client les lit d'abord en base (profil de l'hôtel),
   et ne retombe sur l'URL que si la base est injoignable. Les QR imprimés
   avec une ancienne URL restent donc valables. */
export function guestUrl(
  code: string,
  hotelName?: string | null,
  city?: string | null,
  origin?: string
) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const params = new URLSearchParams();
  if (hotelName) params.set("h", hotelName);
  if (city) params.set("c", city);
  const qs = params.toString();
  return `${base}/s/${code}${qs ? `?${qs}` : ""}`;
}

export function shareByWhatsapp(link: string, hotelName?: string | null) {
  const text = `${hotelName ? `${hotelName} · ` : ""}Réservez vos sorties (restaurants, activités, clubs, services) en quelques secondes : ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function shareByEmail(link: string, hotelName?: string | null) {
  const subject = `${hotelName ?? "Votre hôtel"} : vos sorties à réserver`;
  const body = `Bonjour,\n\nDécouvrez notre sélection de restaurants, activités, clubs et services, et réservez en quelques secondes :\n${link}\n\nÀ très vite,\n${hotelName ?? ""}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
