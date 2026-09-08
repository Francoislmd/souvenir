import { describe, expect, it } from "vitest";
import { zipStream, slugForFilename } from "./zip";

async function collect(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function entry(name: string, content: string) {
  return { name, load: async () => new TextEncoder().encode(content) };
}

describe("zipStream", () => {
  it("écrit une archive lisible : signatures, catalogue, fin d'archive", async () => {
    const zip = await collect(zipStream([entry("a.txt", "bonjour"), entry("b.txt", "salut")]));

    expect(zip.readUInt32LE(0)).toBe(0x04034b50); // premier en-tête local
    const eocd = zip.length - 22;
    expect(zip.readUInt32LE(eocd)).toBe(0x06054b50);
    expect(zip.readUInt16LE(eocd + 10)).toBe(2); // deux entrées au catalogue

    // Le catalogue commence bien où la fin d'archive le dit, et son premier
    // enregistrement porte la bonne signature : c'est ce décalage qui casse
    // en premier si l'écriture des offsets dérape.
    const cdOffset = zip.readUInt32LE(eocd + 16);
    expect(zip.readUInt32LE(cdOffset)).toBe(0x02014b50);
    expect(zip.readUInt32LE(eocd + 12)).toBe(eocd - cdOffset);
  });

  it("stocke sans compresser et garde le contenu intact", async () => {
    const zip = await collect(zipStream([entry("a.txt", "bonjour")]));

    expect(zip.readUInt16LE(8)).toBe(0); // méthode 0 = store
    expect(zip.readUInt32LE(18)).toBe(7); // taille compressée
    expect(zip.readUInt32LE(22)).toBe(7); // taille d'origine
    const nameLen = zip.readUInt16LE(26);
    expect(zip.subarray(30 + nameLen, 30 + nameLen + 7).toString()).toBe("bonjour");
  });

  it("omet une photo illisible plutôt que de casser tout le téléchargement", async () => {
    const zip = await collect(
      zipStream([entry("a.txt", "bonjour"), { name: "manquante.jpg", load: async () => null }, entry("b.txt", "salut")]),
    );

    expect(zip.readUInt16LE(zip.length - 22 + 10)).toBe(2);
    expect(zip.includes(Buffer.from("manquante.jpg"))).toBe(false);
  });

  it("survit à une lecture qui jette", async () => {
    const zip = await collect(
      zipStream([
        {
          name: "cassee.jpg",
          load: async () => {
            throw new Error("réseau coupé");
          },
        },
        entry("a.txt", "bonjour"),
      ]),
    );

    expect(zip.readUInt16LE(zip.length - 22 + 10)).toBe(1);
  });
});

describe("slugForFilename", () => {
  it("réduit un nom de sortie à un nom de fichier", () => {
    expect(slugForFilename("Rafting, Basse Ardèche")).toBe("rafting-basse-ardeche");
    expect(slugForFilename("Canyoning — Gorges du Verdon")).toBe("canyoning-gorges-du-verdon");
  });

  it("ne rend jamais une chaîne vide", () => {
    expect(slugForFilename("!!!")).toBe("photos");
  });
});
