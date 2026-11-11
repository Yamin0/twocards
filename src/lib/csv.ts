/* Export CSV commun aux espaces connectés. Séparateur point-virgule et
   marque d'ordre d'octets UTF-8 : le fichier s'ouvre tel quel dans Excel
   en français, accents compris. */

/* Marque d'ordre d'octets, écrite par son code pour rester visible ici. */
const BOM = String.fromCharCode(0xfeff);

export type CsvCell = string | number | null | undefined;

/* Une cellule saisie par un client (nom, précisions) ne doit pas pouvoir
   devenir une formule à l'ouverture dans un tableur. Les nombres et les
   numéros de téléphone (« +212 6… ») restent intacts. */
function neutralise(text: string) {
  if (/^[=@\t\r]/.test(text)) return `'${text}`;
  if (/^[+-]/.test(text) && !/^[+-]?[\d\s().,-]*$/.test(text)) return `'${text}`;
  return text;
}

function cell(value: CsvCell) {
  if (value === null || value === undefined) return '""';
  const text = typeof value === "number" ? String(value) : neutralise(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: CsvCell[][], footer?: CsvCell[]) {
  const lines = [header, ...rows, ...(footer ? [footer] : [])];
  return lines.map((line) => line.map(cell).join(";")).join("\n");
}

/* Téléchargement d'un fichier fabriqué dans le navigateur. L'adresse blob
   est révoquée après coup : la révoquer juste après le clic fait échouer
   le téléchargement sur Safari et Firefox. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** `filename` sans extension : « .csv » est ajouté. */
export function downloadCsv(
  filename: string,
  header: string[],
  rows: CsvCell[][],
  footer?: CsvCell[]
) {
  const blob = new Blob([BOM + toCsv(header, rows, footer)], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, `${filename}.csv`);
}
