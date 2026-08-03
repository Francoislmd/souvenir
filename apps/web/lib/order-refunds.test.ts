import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleChargeRefunded, handleDisputeCreated, handleDisputeClosed } from "./order-refunds";

const { prismaMock, trackMock } = vi.hoisted(() => ({
  prismaMock: { order: { findUnique: vi.fn(), update: vi.fn() } },
  trackMock: vi.fn(),
}));
vi.mock("./prisma", () => ({ prisma: prismaMock }));
vi.mock("./analytics", () => ({ track: trackMock }));

function makeOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "order_1",
    participantId: "participant_1",
    status: "succeeded",
    refundedAmountCents: 0,
    disputeStatus: null,
    participant: { sortie: { operatorId: "operator_1" } },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleChargeRefunded", () => {
  it("ignore un événement sans payment_intent", async () => {
    await handleChargeRefunded({ payment_intent: null, amount_refunded: 500, refunded: false } as never);
    expect(prismaMock.order.findUnique).not.toHaveBeenCalled();
  });

  it("ignore un remboursement rejoué (amount_refunded déjà appliqué)", async () => {
    prismaMock.order.findUnique.mockResolvedValue(makeOrder({ refundedAmountCents: 500 }));
    await handleChargeRefunded({ payment_intent: "pi_1", amount_refunded: 500, refunded: false } as never);
    expect(prismaMock.order.update).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("verrouille la galerie sur un remboursement partiel (pas de politique de remboursement partiel)", async () => {
    prismaMock.order.findUnique.mockResolvedValue(makeOrder({ refundedAmountCents: 0 }));
    prismaMock.order.update.mockResolvedValue({ refundedAmountCents: 300 });
    await handleChargeRefunded({ payment_intent: "pi_1", amount_refunded: 300, refunded: false } as never);
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "refunded", refundedAmountCents: 300 }) }),
    );
    expect(trackMock).toHaveBeenCalledWith("order_refunded", expect.objectContaining({ operatorId: "operator_1" }));
  });

  it("accepte le payment_intent sous forme d'objet Stripe expansé", async () => {
    prismaMock.order.findUnique.mockResolvedValue(makeOrder());
    prismaMock.order.update.mockResolvedValue({ refundedAmountCents: 1000 });
    await handleChargeRefunded({ payment_intent: { id: "pi_1" }, amount_refunded: 1000, refunded: true } as never);
    expect(prismaMock.order.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { stripePi: "pi_1" } }));
  });
});

describe("handleDisputeCreated", () => {
  it("ignore un litige déjà enregistré avec le même statut (retry webhook)", async () => {
    prismaMock.order.findUnique.mockResolvedValue(makeOrder({ disputeStatus: "needs_response" }));
    await handleDisputeCreated({ payment_intent: "pi_1", status: "needs_response", reason: "fraudulent", amount: 1000 } as never);
    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  it("passe la commande en disputed", async () => {
    prismaMock.order.findUnique.mockResolvedValue(makeOrder({ disputeStatus: null }));
    await handleDisputeCreated({ payment_intent: "pi_1", status: "needs_response", reason: "fraudulent", amount: 1000 } as never);
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "disputed", disputeStatus: "needs_response" }) }),
    );
  });
});

describe("handleDisputeClosed", () => {
  it("restaure l'accès quand le litige est gagné", async () => {
    prismaMock.order.findUnique.mockResolvedValue(makeOrder({ status: "disputed", disputeStatus: "needs_response" }));
    await handleDisputeClosed({ payment_intent: "pi_1", status: "won", reason: "fraudulent", amount: 1000 } as never);
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "succeeded", disputeStatus: "won" }) }),
    );
  });

  it("traite un litige perdu comme un remboursement total", async () => {
    prismaMock.order.findUnique.mockResolvedValue(makeOrder({ status: "disputed", disputeStatus: "under_review" }));
    await handleDisputeClosed({ payment_intent: "pi_1", status: "lost", reason: "fraudulent", amount: 1000 } as never);
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "refunded", disputeStatus: "lost" }) }),
    );
  });
});
