/** Lien WhatsApp vers un numéro saisi librement (« 06 12 34 56 78 »,
    « 00212… », « +212… »), avec un début de message. */
export function waLink(phone: string, text: string) {
  let d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = `+${d.slice(2)}`;
  if (d.startsWith("0") && d.length === 10) d = `+212${d.slice(1)}`;
  return `https://wa.me/${d.replace(/\+/g, "")}?text=${encodeURIComponent(text)}`;
}
