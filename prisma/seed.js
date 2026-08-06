const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const INVENTORY = [
  { sku: 'YEA-T54W', name: 'Yealink T54W IP Phone', category: 'Phones', unit: 'each', cost: 118, price: 189, stock: 24 },
  { sku: 'YEA-W73P', name: 'Yealink W73P Cordless DECT Handset', category: 'Phones', unit: 'each', cost: 96, price: 165, stock: 11 },
  { sku: 'POLY-VVX250', name: 'Poly VVX 250 Desk Phone', category: 'Phones', unit: 'each', cost: 74, price: 129, stock: 30 },
  { sku: 'GRA-GDS3710', name: 'Grandstream GDS3710 Door Intercom', category: 'Access Control', unit: 'each', cost: 232, price: 379, stock: 6 },
  { sku: 'UBQ-USW24P', name: 'UniFi Switch 24 PoE (250W)', category: 'Network', unit: 'each', cost: 379, price: 549, stock: 8 },
  { sku: 'UBQ-U6PRO', name: 'UniFi U6 Pro Access Point', category: 'Network', unit: 'each', cost: 139, price: 219, stock: 17 },
  { sku: 'UBQ-UDMSE', name: 'UniFi Dream Machine SE Gateway', category: 'Network', unit: 'each', cost: 449, price: 649, stock: 4 },
  { sku: 'CAT6-1000', name: 'Cat6 Riser Cable, 1000 ft Box', category: 'Cabling', unit: 'box', cost: 128, price: 199, stock: 22 },
  { sku: 'KEY-C6-BLU', name: 'Cat6 Keystone Jack, Blue', category: 'Cabling', unit: 'each', cost: 1.4, price: 4.5, stock: 480 },
  { sku: 'PP-24-C6', name: '24-Port Cat6 Patch Panel', category: 'Cabling', unit: 'each', cost: 42, price: 79, stock: 14 },
  { sku: 'RACK-12U', name: '12U Wall-Mount Network Rack', category: 'Cabling', unit: 'each', cost: 165, price: 265, stock: 5 },
  { sku: 'HIK-DS2CD', name: 'Hikvision 4MP Turret IP Camera', category: 'Surveillance', unit: 'each', cost: 108, price: 179, stock: 19 },
  { sku: 'HIK-NVR8', name: '8-Channel NVR, 4TB', category: 'Surveillance', unit: 'each', cost: 298, price: 465, stock: 7 },
  { sku: 'ALG-PAGE1', name: 'Algo 8180 SIP Paging Adapter', category: 'Paging', unit: 'each', cost: 245, price: 389, stock: 9 },
  { sku: 'APC-SMT1500', name: 'APC Smart-UPS 1500VA', category: 'Power', unit: 'each', cost: 512, price: 749, stock: 3 },
];

const CUSTOMERS = [
  {
    name: 'Harbor Point Dental Group',
    contact: 'Renee Alvarado',
    email: 'renee@harborpointdental.com',
    phone: '(714) 555-0198',
    address: '18271 McDurmott West, Ste C',
    city: 'Irvine',
    state: 'CA',
    zip: '92614',
    notes: '3 operatories, expanding to a second suite in Q4.',
  },
  {
    name: 'Ridgeline Property Management',
    contact: 'Marcus Teo',
    email: 'mteo@ridgelinepm.com',
    phone: '(949) 555-0122',
    address: '30021 Tomas, Ste 210',
    city: 'Rancho Santa Margarita',
    state: 'CA',
    zip: '92688',
    notes: 'Front desk phones failing. Wants hosted VoIP quote.',
  },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding. Example:\n' +
        '  ADMIN_EMAIL=you@communicationmall.com ADMIN_PASSWORD="a-long-password" npm run db:seed'
    );
  }
  if (password.length < 10) throw new Error('Use an admin password of at least 10 characters.');

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Communication Mall',
      tagline: 'Business telecom, sourced and installed',
      address: 'Irvine, CA',
      phone: '(949) 555-0140',
      email: 'service@communicationmall.com',
      defaultTaxRate: 7.75,
      laborRate: 125,
      quoteCounter: 1000,
      orderCounter: 2000,
      invoiceCounter: 3000,
    },
  });

  await prisma.user.upsert({
    where: { email },
    update: { role: 'admin' },
    create: {
      email,
      name: process.env.ADMIN_NAME || 'Owner',
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin',
    },
  });
  console.log(`Admin ready: ${email}`);

  for (const item of INVENTORY) {
    await prisma.inventoryItem.upsert({ where: { sku: item.sku }, update: {}, create: item });
  }
  console.log(`Inventory: ${INVENTORY.length} SKUs`);

  if (process.env.SEED_SAMPLE_CUSTOMERS === 'true') {
    for (const c of CUSTOMERS) {
      const exists = await prisma.customer.findFirst({ where: { name: c.name } });
      if (!exists) await prisma.customer.create({ data: c });
    }
    console.log('Sample customers added.');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
