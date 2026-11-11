import { ImageResponse } from "next/og";

/* Image de partage du site (Open Graph et Twitter), générée à la
   compilation : le mot-symbole sur le noir du héros. Volontairement sans
   phrase : la même image sert aux deux langues, le titre et la description
   de chaque page sont portés par ses métadonnées. */
export const alt = "twocards.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0a0a0a",
          color: "#fffdf9",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "rgba(255,253,249,0.7)" }}>
          Marrakech
        </div>
        <div style={{ display: "flex", fontSize: 168, fontWeight: 700, letterSpacing: -8 }}>
          twocards
          <span style={{ color: "rgba(255,253,249,0.5)" }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "rgba(255,253,249,0.7)" }}>
          twocardspro.com
        </div>
      </div>
    ),
    size,
  );
}
