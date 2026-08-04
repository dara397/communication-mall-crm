import { prisma } from "./prisma";

const PREFIX: Record<string, string> = {
  QUOTE: "Q",
  ORDER: "SO",
  INVOICE: "INV",
};

/**
 * Atomically increments the counter for the given document type and returns a
 * human-friendly number like "Q-1001". Safe under concurrent calls.
 */
export async function nextNumber(key: "QUOTE" | "ORDER" | "INVOICE"): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { key },
    update: { value: { increment: 1 } },
    create: { key, value: 1001 },
  });
  const prefix = PREFIX[key] || key;
  return `${prefix}-${counter.value}`;
}
