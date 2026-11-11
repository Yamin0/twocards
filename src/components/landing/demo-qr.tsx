/* QR code de démonstration des pages publiques : un vrai QR, qui ouvre le
   menu de démonstration (DEMO_QR_URL, ci-dessous).

   Le tracé est calculé une fois pour toutes au lieu d'être recalculé dans
   le navigateur : react-qr-code et son générateur ne font plus partie du
   JavaScript de l'accueil ni de la page Hôtels, et le SVG pèse 3 Ko dans
   le HTML au lieu de 21 Ko (un rectangle par suite de modules sombres, au
   lieu d'un carré par module, clair ou sombre).

   Même matrice que <QRCode value={DEMO_QR_URL} level="M" /> : 29 modules
   de côté, correction d'erreur M. Si DEMO_QR_URL change, il faut
   régénérer DARK : pour chaque ligne r et chaque suite de modules sombres
   allant de la colonne c à la colonne e exclue (qrcode-generator, isDark),
   écrire « M{c} {r}h{e-c}v1H{c}z ».

   Les espaces connectés, dont les QR dépendent des données, gardent
   react-qr-code. */

/* Adresse encodée dans DARK. La changer ici ne suffit pas : il faut
   régénérer le tracé. */
export const DEMO_QR_URL = "https://twocardspro.com/s/a1f3c07b";

const MODULES = 29;

const DARK =
  "M0 0h7v1H0zM8 0h1v1H8zM10 0h6v1H10zM17 0h4v1H17zM22 0h7v1H22zM0 1h1v1H0z" +
  "M6 1h1v1H6zM8 1h1v1H8zM11 1h1v1H11zM13 1h1v1H13zM16 1h3v1H16z" +
  "M22 1h1v1H22zM28 1h1v1H28zM0 2h1v1H0zM2 2h3v1H2zM6 2h1v1H6zM9 2h4v1H9z" +
  "M16 2h1v1H16zM18 2h1v1H18zM20 2h1v1H20zM22 2h1v1H22zM24 2h3v1H24z" +
  "M28 2h1v1H28zM0 3h1v1H0zM2 3h3v1H2zM6 3h1v1H6zM8 3h2v1H8zM14 3h2v1H14z" +
  "M17 3h3v1H17zM22 3h1v1H22zM24 3h3v1H24zM28 3h1v1H28zM0 4h1v1H0z" +
  "M2 4h3v1H2zM6 4h1v1H6zM9 4h1v1H9zM11 4h1v1H11zM14 4h1v1H14zM16 4h1v1H16z" +
  "M19 4h1v1H19zM22 4h1v1H22zM24 4h3v1H24zM28 4h1v1H28zM0 5h1v1H0z" +
  "M6 5h1v1H6zM9 5h5v1H9zM15 5h6v1H15zM22 5h1v1H22zM28 5h1v1H28zM0 6h7v1H0z" +
  "M8 6h1v1H8zM10 6h1v1H10zM12 6h1v1H12zM14 6h1v1H14zM16 6h1v1H16z" +
  "M18 6h1v1H18zM20 6h1v1H20zM22 6h7v1H22zM8 7h1v1H8zM10 7h1v1H10z" +
  "M12 7h1v1H12zM15 7h6v1H15zM0 8h1v1H0zM2 8h2v1H2zM5 8h3v1H5zM11 8h1v1H11z" +
  "M13 8h1v1H13zM15 8h5v1H15zM22 8h1v1H22zM25 8h1v1H25zM27 8h2v1H27z" +
  "M1 9h2v1H1zM4 9h1v1H4zM9 9h1v1H9zM11 9h1v1H11zM13 9h3v1H13zM19 9h6v1H19z" +
  "M28 9h1v1H28zM3 10h1v1H3zM6 10h1v1H6zM9 10h5v1H9zM20 10h1v1H20z" +
  "M24 10h1v1H24zM26 10h2v1H26zM0 11h1v1H0zM2 11h2v1H2zM5 11h1v1H5z" +
  "M7 11h3v1H7zM12 11h1v1H12zM15 11h2v1H15zM18 11h1v1H18zM20 11h3v1H20z" +
  "M28 11h1v1H28zM0 12h3v1H0zM6 12h2v1H6zM9 12h2v1H9zM14 12h2v1H14z" +
  "M17 12h3v1H17zM25 12h2v1H25zM3 13h2v1H3zM9 13h1v1H9zM11 13h2v1H11z" +
  "M14 13h3v1H14zM19 13h4v1H19zM26 13h3v1H26zM0 14h1v1H0zM4 14h1v1H4z" +
  "M6 14h2v1H6zM13 14h1v1H13zM17 14h4v1H17zM22 14h3v1H22zM26 14h3v1H26z" +
  "M3 15h1v1H3zM7 15h1v1H7zM9 15h1v1H9zM11 15h2v1H11zM14 15h1v1H14z" +
  "M16 15h1v1H16zM19 15h5v1H19zM27 15h1v1H27zM0 16h3v1H0zM6 16h1v1H6z" +
  "M8 16h2v1H8zM11 16h1v1H11zM14 16h1v1H14zM16 16h1v1H16zM18 16h4v1H18z" +
  "M23 16h3v1H23zM27 16h1v1H27zM1 17h3v1H1zM7 17h1v1H7zM9 17h4v1H9z" +
  "M14 17h3v1H14zM20 17h1v1H20zM23 17h1v1H23zM25 17h3v1H25zM0 18h1v1H0z" +
  "M3 18h2v1H3zM6 18h1v1H6zM8 18h1v1H8zM10 18h2v1H10zM13 18h3v1H13z" +
  "M18 18h1v1H18zM23 18h1v1H23zM26 18h1v1H26zM3 19h2v1H3zM9 19h2v1H9z" +
  "M13 19h2v1H13zM17 19h4v1H17zM26 19h1v1H26zM1 20h2v1H1zM5 20h10v1H5z" +
  "M17 20h1v1H17zM19 20h8v1H19zM8 21h1v1H8zM10 21h2v1H10zM19 21h2v1H19z" +
  "M24 21h5v1H24zM0 22h7v1H0zM8 22h1v1H8zM10 22h3v1H10zM14 22h1v1H14z" +
  "M16 22h2v1H16zM19 22h2v1H19zM22 22h1v1H22zM24 22h2v1H24zM27 22h1v1H27z" +
  "M0 23h1v1H0zM6 23h1v1H6zM8 23h9v1H8zM18 23h1v1H18zM20 23h1v1H20z" +
  "M24 23h2v1H24zM0 24h1v1H0zM2 24h3v1H2zM6 24h1v1H6zM9 24h1v1H9z" +
  "M11 24h1v1H11zM15 24h1v1H15zM17 24h1v1H17zM20 24h5v1H20zM26 24h2v1H26z" +
  "M0 25h1v1H0zM2 25h3v1H2zM6 25h1v1H6zM8 25h1v1H8zM12 25h1v1H12z" +
  "M15 25h3v1H15zM20 25h2v1H20zM24 25h2v1H24zM28 25h1v1H28zM0 26h1v1H0z" +
  "M2 26h3v1H2zM6 26h1v1H6zM8 26h1v1H8zM11 26h2v1H11zM14 26h1v1H14z" +
  "M17 26h3v1H17zM21 26h1v1H21zM23 26h1v1H23zM26 26h1v1H26zM28 26h1v1H28z" +
  "M0 27h1v1H0zM6 27h1v1H6zM11 27h1v1H11zM13 27h1v1H13zM18 27h4v1H18z" +
  "M24 27h2v1H24zM27 27h1v1H27zM0 28h7v1H0zM8 28h4v1H8zM14 28h1v1H14z" +
  "M16 28h1v1H16zM19 28h4v1H19zM25 28h1v1H25zM27 28h1v1H27z";

export function DemoQr({ label }: { label: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={96}
      height={96}
      viewBox={`0 0 ${MODULES} ${MODULES}`}
      aria-label={label}
      style={{ display: "block", width: 96, height: 96 }}
    >
      <path d={`M0 0h${MODULES}v${MODULES}H0z`} fill="#ffffff" />
      <path d={DARK} fill="#0d0d0d" />
    </svg>
  );
}
