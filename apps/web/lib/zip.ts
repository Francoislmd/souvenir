/**
 * Écriture d'une archive ZIP en flux, sans dépendance.
 *
 * Pourquoi à la main : le seul contenu qu'on archive, ce sont des JPEG et
 * des MP4, déjà compressés — un vrai compresseur ne gagnerait rien et
 * coûterait du CPU sur une fonction serverless. On se limite donc à la
 * méthode "store" (0), ce qui rend le format assez simple pour être écrit
 * ici plutôt que d'ajouter une dépendance au projet.
 *
 * En flux, et fichier par fichier : le zip d'un créneau peut peser
 * plusieurs centaines de mégaoctets, mais on ne garde jamais en mémoire
 * qu'UN original à la fois. C'est ce qui permet à la route de tenir dans
 * l'enveloppe mémoire d'une fonction.
 */

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
const STORE = 0;
const UTF8_FLAG = 0x0800;
const VERSION = 20;

/** Au-delà, il faudrait le format ZIP64 — voir `ZipTooLargeError`. */
const MAX_TOTAL_BYTES = 0xffffffff;
const MAX_ENTRIES = 0xffff;

export class ZipTooLargeError extends Error {
  constructor() {
    super("archive trop volumineuse pour un zip 32 bits");
  }
}

let crcTable: Uint32Array | null = null;
function table(): Uint32Array {
  if (crcTable) return crcTable;
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  crcTable = t;
  return t;
}

function crc32(bytes: Uint8Array): number {
  const t = table();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Horodatage MS-DOS (résolution 2 s) — le seul que le format connaisse. */
function dosDateTime(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2) & 0x1f),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export interface ZipEntrySource {
  /** Nom du fichier dans l'archive, chemins en avant, sans slash de tête. */
  name: string;
  /** Appelé au moment d'écrire l'entrée, jamais avant : c'est ce qui borne la mémoire. */
  load: () => Promise<Uint8Array | null>;
}

interface CentralEntry {
  name: Uint8Array;
  crc: number;
  size: number;
  offset: number;
  time: number;
  date: number;
}

/**
 * Rend un flux ZIP à partir d'une liste d'entrées paresseuses. Une entrée
 * dont `load()` échoue ou renvoie null est simplement omise : mieux vaut un
 * client qui reçoit onze photos sur douze qu'un téléchargement qui casse en
 * entier au dernier fichier.
 */
export function zipStream(entries: ZipEntrySource[], now = new Date()): ReadableStream<Uint8Array> {
  const central: CentralEntry[] = [];
  let offset = 0;
  let index = 0;

  function push(controller: ReadableStreamDefaultController<Uint8Array>, chunk: Uint8Array): void {
    controller.enqueue(chunk);
    offset += chunk.length;
  }

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      // Boucle, et ne rend la main qu'une fois quelque chose écrit : un
      // `pull` qui se termine sans rien mettre dans le flux n'est pas
      // rappelé par le navigateur, et le téléchargement reste suspendu pour
      // toujours. C'est exactement ce qui arrive sur une photo illisible.
      while (index < entries.length) {
        const entry = entries[index++]!;
        const data = await entry.load().catch(() => null);
        if (!data) continue;

        if (central.length >= MAX_ENTRIES || offset + data.length > MAX_TOTAL_BYTES) {
          controller.error(new ZipTooLargeError());
          return;
        }

        const name = new TextEncoder().encode(entry.name);
        const { time, date } = dosDateTime(now);
        const crc = crc32(data);

        const header = new DataView(new ArrayBuffer(30));
        header.setUint32(0, LOCAL_SIG, true);
        header.setUint16(4, VERSION, true);
        header.setUint16(6, UTF8_FLAG, true);
        header.setUint16(8, STORE, true);
        header.setUint16(10, time, true);
        header.setUint16(12, date, true);
        header.setUint32(14, crc, true);
        header.setUint32(18, data.length, true);
        header.setUint32(22, data.length, true);
        header.setUint16(26, name.length, true);
        header.setUint16(28, 0, true);

        central.push({ name, crc, size: data.length, offset, time, date });
        push(controller, new Uint8Array(header.buffer));
        push(controller, name);
        push(controller, data);
        return;
      }

      // Toutes les entrées sont écrites : le catalogue, puis la fin d'archive.
      const start = offset;
      for (const e of central) {
        const record = new DataView(new ArrayBuffer(46));
        record.setUint32(0, CENTRAL_SIG, true);
        record.setUint16(4, VERSION, true);
        record.setUint16(6, VERSION, true);
        record.setUint16(8, UTF8_FLAG, true);
        record.setUint16(10, STORE, true);
        record.setUint16(12, e.time, true);
        record.setUint16(14, e.date, true);
        record.setUint32(16, e.crc, true);
        record.setUint32(20, e.size, true);
        record.setUint32(24, e.size, true);
        record.setUint16(28, e.name.length, true);
        record.setUint32(42, e.offset, true);
        push(controller, new Uint8Array(record.buffer));
        push(controller, e.name);
      }

      const end = new DataView(new ArrayBuffer(22));
      end.setUint32(0, EOCD_SIG, true);
      end.setUint16(8, central.length, true);
      end.setUint16(10, central.length, true);
      end.setUint32(12, offset - start, true);
      end.setUint32(16, start, true);
      push(controller, new Uint8Array(end.buffer));

      controller.close();
    },
  });
}

/** "Rafting, Basse Ardèche" → "rafting-basse-ardeche" — pour nommer le fichier. */
export function slugForFilename(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "photos";
}
