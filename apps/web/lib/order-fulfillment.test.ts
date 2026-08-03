import { describe, it, expect, vi, beforeEach } from "vitest";
import { fulfillPaymentIntent } from "./order-fulfillment";

const { prismaMock, trackMock } = vi.hoisted(() => ({
  prismaMock: {
    order: { findUnique: vi.fn(), update: vi.fn() },
    participant: { findUnique: vi.fn(), update: vi.fn() },
    photo: { count: vi.fn() },
  },
  trackMock: vi.fn(),
}));
vi.mock("./prisma", () => ({ prisma: prismaMock }));
vi.mock("./analytics", () => ({ track: trackMock }));
vi.mock("./env", () => ({ env: { NEXT_PUBLIC_APP_URL: "https://linktrip.test" } }));
vi.mock("./automations", () => ({ readAutomations: vi.fn(() => ({ resendUnopened: false, reducedPriceOffer: false, reviewRequest: false, referral: false })) }));
vi.mock("./twilio", () => ({ sendWhatsAppMessage: vi.fn() }));
vi.mock("./email", () => ({ sendOrderConfirmedEmail: vi.fn() }));

function makeIntent(overrides: Partial<Record<string, unknown>> = {}) {
  return { id: "pi_1", metadata: { participantId: "participant_1" }, ...overrides } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fulfillPaymentIntent — garde d'idempotence", () => {
  it("ne fait rien sans participantId dans les metadata", async () => {
    await fulfillPaymentIntent(makeIntent({ metadata: {} }));
    expect(prismaMock.order.findUnique).not.toHaveBeenCalled();
  });

  it("ne fait rien si aucune commande ne correspond au participant", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);
    await fulfillPaymentIntent(makeIntent());
    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  it("ne fait rien si le PaymentIntent ne correspond pas à celui stocké sur la commande", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: "order_1", stripePi: "pi_other", status: "pending" });
    await fulfillPaymentIntent(makeIntent());
    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  it("ne fait rien si la commande est déjà marquée succeeded (webhook + confirm rejoués)", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: "order_1", stripePi: "pi_1", status: "succeeded" });
    await fulfillPaymentIntent(makeIntent());
    expect(prismaMock.order.update).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("marque la commande succeeded quand la garde passe", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: "order_1", stripePi: "pi_1", status: "pending" });
    prismaMock.order.update.mockResolvedValue({ id: "order_1", status: "succeeded", amountCents: 2900, photoIds: [] });
    prismaMock.participant.findUnique.mockResolvedValue(null); // coupe court avant l'envoi des messages post-achat

    await fulfillPaymentIntent(makeIntent());

    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "order_1" }, data: expect.objectContaining({ status: "succeeded" }) }),
    );
  });
});
