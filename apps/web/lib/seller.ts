import { prisma } from "./prisma";
import { sellerFromOperator, type Seller } from "./seller-format";

export type { Seller } from "./seller-format";

/** Le vendeur d'un opérateur : son identité légale et l'e-mail de son premier administrateur. */
export async function getSeller(operatorId: string): Promise<Seller | null> {
  const operator = await prisma.operator.findUnique({
    where: { id: operatorId },
    select: {
      name: true,
      legalName: true,
      legalAddress: true,
      siret: true,
      vatExempt: true,
      users: { where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, take: 1, select: { email: true } },
    },
  });
  if (!operator) return null;
  return sellerFromOperator(operator, operator.users[0]?.email ?? null);
}
