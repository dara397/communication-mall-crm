import { prisma } from "./prisma";

// Loads the lookup lists the DocumentForm needs.
export async function loadFormLookups() {
  const [customers, products, equipment] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true, mrc: true, nrc: true, chargeType: true },
    }),
    prisma.equipment.findMany({
      orderBy: { name: "asc" },
      select: { id: true, sku: true, name: true, unitPrice: true },
    }),
  ]);
  return { customers, products, equipment };
}
