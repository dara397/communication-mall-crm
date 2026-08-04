import "dotenv/config";
import { PrismaClient, ChargeType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Admin user -------------------------------------------------
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@communicationmall.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.SEED_ADMIN_NAME || "Administrator";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { name, role: "ADMIN" },
    create: { email, name, passwordHash, role: "ADMIN" },
  });
  console.log(`✔ Admin user ready: ${email}`);

  // --- Document counters -----------------------------------------
  for (const key of ["QUOTE", "ORDER", "INVOICE"]) {
    await prisma.counter.upsert({
      where: { key },
      update: {},
      create: { key, value: 1000 },
    });
  }
  console.log("✔ Counters initialized");

  // --- Sample products (replace via npm run import:pricelist) -----
  const sampleProducts: Array<{
    code: string;
    name: string;
    category: string;
    chargeType: ChargeType;
    mrc: number;
    nrc: number;
    description?: string;
  }> = [
    { code: "VOIP-SEAT", name: "Hosted VoIP Seat", category: "Voice", chargeType: "MRC", mrc: 24.95, nrc: 0, description: "Per-user hosted PBX extension" },
    { code: "VOIP-DID", name: "Direct Inward Dial Number", category: "Voice", chargeType: "MRC", mrc: 1.5, nrc: 0 },
    { code: "SIP-TRUNK", name: "SIP Trunk Channel", category: "Voice", chargeType: "MRC", mrc: 15.0, nrc: 0 },
    { code: "FIBER-100", name: "Dedicated Fiber 100Mbps", category: "Internet", chargeType: "MRC", mrc: 399.0, nrc: 500.0, description: "Symmetrical dedicated fiber with SLA" },
    { code: "FIBER-500", name: "Dedicated Fiber 500Mbps", category: "Internet", chargeType: "MRC", mrc: 899.0, nrc: 500.0 },
    { code: "INSTALL-STD", name: "Standard Installation", category: "Services", chargeType: "NRC", mrc: 0, nrc: 150.0, description: "On-site standard install, first hour" },
    { code: "INSTALL-HR", name: "Additional Install Hour", category: "Services", chargeType: "NRC", mrc: 0, nrc: 95.0 },
    { code: "PHONE-DESK", name: "Desk IP Phone", category: "Hardware", chargeType: "NRC", mrc: 0, nrc: 129.0 },
    { code: "PHONE-CONF", name: "Conference IP Phone", category: "Hardware", chargeType: "NRC", mrc: 0, nrc: 349.0 },
    { code: "SUPPORT-MRC", name: "Managed Support Plan", category: "Services", chargeType: "MRC", mrc: 49.0, nrc: 0, description: "Monthly managed voice/data support" },
  ];

  for (const p of sampleProducts) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log(`✔ ${sampleProducts.length} sample products seeded`);

  // --- Sample equipment inventory --------------------------------
  const sampleEquipment = [
    { sku: "CBL-CAT6-1000", name: "Cat6 Cable Box (1000ft)", category: "Cabling", unitCost: 89.0, unitPrice: 149.0, quantityOnHand: 12 },
    { sku: "RJ45-100", name: "RJ45 Connectors (100pk)", category: "Cabling", unitCost: 8.0, unitPrice: 18.0, quantityOnHand: 30 },
    { sku: "SW-24P", name: "24-Port Gigabit Switch", category: "Networking", unitCost: 145.0, unitPrice: 279.0, quantityOnHand: 6 },
    { sku: "RTR-BIZ", name: "Business Router / Firewall", category: "Networking", unitCost: 210.0, unitPrice: 399.0, quantityOnHand: 4 },
    { sku: "RACK-12U", name: "12U Wall-Mount Rack", category: "Hardware", unitCost: 120.0, unitPrice: 229.0, quantityOnHand: 3 },
  ];
  for (const e of sampleEquipment) {
    await prisma.equipment.upsert({
      where: { sku: e.sku },
      update: {},
      create: e,
    });
  }
  console.log(`✔ ${sampleEquipment.length} sample equipment items seeded`);

  // --- One demo customer -----------------------------------------
  await prisma.customer.upsert({
    where: { id: "demo-customer" },
    update: {},
    create: {
      id: "demo-customer",
      name: "Demo Business Account",
      company: "Demo Business Inc.",
      email: "contact@demo-business.com",
      phone: "(555) 555-0142",
      address: "500 Technology Dr",
      city: "Irvine",
      state: "CA",
      zip: "92618",
      notes: "Example customer created by the seed. Safe to delete.",
    },
  });
  console.log("✔ Demo customer seeded");

  console.log("\nSeed complete. Log in with the admin credentials above.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
