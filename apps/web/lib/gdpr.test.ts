import { describe, it, expect, vi, beforeEach } from "vitest";
import { purgeParticipant, purgeGroupSortie, runGdprPurgeScan, runGroupPurgeScan } from "./gdpr";

const { prismaMock, trackMock, deleteStorageObjectsMock } = vi.hoisted(() => ({
  prismaMock: {
    participant: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    photo: { deleteMany: vi.fn() },
    slot: { deleteMany: vi.fn() },
    sortie: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
  trackMock: vi.fn(),
  deleteStorageObjectsMock: vi.fn(),
}));
vi.mock("./prisma", () => ({ prisma: prismaMock }));
vi.mock("./analytics", () => ({ track: trackMock }));
vi.mock("./storage", () => ({
  deleteStorageObjects: deleteStorageObjectsMock,
  ORIGINALS_BUCKET: "originals",
  PREVIEWS_BUCKET: "previews",
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("purgeParticipant", () => {
  it("ne fait rien si le participant est introuvable", async () => {
    prismaMock.participant.findUnique.mockResolvedValue(null);
    await purgeParticipant("participant_1");
    expect(prismaMock.photo.deleteMany).not.toHaveBeenCalled();
  });

  it("ne fait rien si le participant est déjà purgé (idempotent)", async () => {
    prismaMock.participant.findUnique.mockResolvedValue({ id: "participant_1", deletedAt: new Date(), photos: [], sortie: {} });
    await purgeParticipant("participant_1");
    expect(prismaMock.photo.deleteMany).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("supprime les fichiers, les photos et anonymise le participant", async () => {
    prismaMock.participant.findUnique.mockResolvedValue({
      id: "participant_1",
      deletedAt: null,
      sortie: { operatorId: "operator_1" },
      photos: [
        { originalKey: "orig/1.jpg", previewKey: "prev/1.jpg", thumbKey: "thumb/1.jpg" },
        { originalKey: "orig/2.jpg", previewKey: null, thumbKey: null },
      ],
    });

    await purgeParticipant("participant_1");

    expect(deleteStorageObjectsMock).toHaveBeenCalledWith("originals", ["orig/1.jpg", "orig/2.jpg"]);
    expect(deleteStorageObjectsMock).toHaveBeenCalledWith("previews", ["prev/1.jpg", "thumb/1.jpg"]);
    expect(prismaMock.photo.deleteMany).toHaveBeenCalledWith({ where: { ownerId: "participant_1" } });
    expect(prismaMock.participant.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Supprimé", contact: "", deletedAt: expect.any(Date) }) }),
    );
    expect(trackMock).toHaveBeenCalledWith("gdpr_deletion", { operatorId: "operator_1", participantId: "participant_1" });
  });
});

describe("runGdprPurgeScan", () => {
  it("ne sélectionne que les participants dont deleteAt est échu et non encore supprimés", async () => {
    const now = new Date("2026-08-03T00:00:00Z");
    prismaMock.participant.findMany.mockResolvedValue([]);

    await runGdprPurgeScan(now);

    expect(prismaMock.participant.findMany).toHaveBeenCalledWith({
      where: { deleteAt: { lte: now }, deletedAt: null },
      select: { id: true },
    });
  });

  it("purge chaque participant échu et retourne le compte", async () => {
    prismaMock.participant.findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);
    prismaMock.participant.findUnique.mockResolvedValue({
      id: "p1",
      deletedAt: null,
      sortie: { operatorId: "operator_1" },
      photos: [],
    });

    const result = await runGdprPurgeScan(new Date());

    expect(prismaMock.participant.findUnique).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ purged: 2 });
  });
});

describe("purgeGroupSortie", () => {
  it("ne fait rien pour une sortie en mode INDIVIDUEL", async () => {
    prismaMock.sortie.findUnique.mockResolvedValue({ id: "s1", mode: "INDIVIDUEL", purgeAt: new Date(), photos: [] });
    await purgeGroupSortie("s1");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("ne fait rien si purgeAt n'est pas fixé", async () => {
    prismaMock.sortie.findUnique.mockResolvedValue({ id: "s1", mode: "GROUPE", purgeAt: null, photos: [] });
    await purgeGroupSortie("s1");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("supprime les fichiers et les lignes photo/slot d'une sortie GROUPE échue", async () => {
    prismaMock.sortie.findUnique.mockResolvedValue({
      id: "s1",
      operatorId: "operator_1",
      mode: "GROUPE",
      purgeAt: new Date(),
      photos: [{ originalKey: "o1", previewKey: "p1", thumbKey: null, blurKey: null, blurEmailKey: null, groupPreviewKey: "gp1" }],
    });

    await purgeGroupSortie("s1");

    expect(deleteStorageObjectsMock).toHaveBeenCalledWith("originals", ["o1"]);
    expect(deleteStorageObjectsMock).toHaveBeenCalledWith("previews", ["p1", "gp1"]);
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(trackMock).toHaveBeenCalledWith("group_purge", { operatorId: "operator_1", meta: { sortieId: "s1" } });
  });
});

describe("runGroupPurgeScan", () => {
  it("ne sélectionne que les sorties GROUPE dont purgeAt est échu", async () => {
    const now = new Date("2026-08-03T00:00:00Z");
    prismaMock.sortie.findMany.mockResolvedValue([]);

    await runGroupPurgeScan(now);

    expect(prismaMock.sortie.findMany).toHaveBeenCalledWith({
      where: { mode: "GROUPE", purgeAt: { lte: now } },
      select: { id: true },
    });
  });
});
