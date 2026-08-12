/**
 * Loads the telecom price book into the CatalogItem table.
 *   npm run catalog:import
 * Safe to re-run: it upserts by USOC, so existing items are updated, not duplicated.
 * Reads prisma/catalog-data.json (generated from the uploaded spreadsheet).
 */
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const file = path.join(__dirname, 'catalog-data.json');
  if (!fs.existsSync(file)) {
    throw new Error('catalog-data.json is missing from the prisma folder.');
  }
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`Importing ${items.length} catalog items...`);

  let created = 0;
  let updated = 0;
  for (const it of items) {
    const existing = await prisma.catalogItem.findUnique({ where: { usoc: it.usoc } });
    await prisma.catalogItem.upsert({
      where: { usoc: it.usoc },
      update: {
        billingCode: it.billingCode,
        name: it.name,
        category: it.category,
        portfolio: it.portfolio,
        description: it.description,
        cost: it.cost || 0,
        mrc: it.mrc,
        nrc: it.nrc,
        glCode: it.glCode,
      },
      create: it,
    });
    existing ? updated++ : created++;
  }

  const total = await prisma.catalogItem.count();
  console.log(`Done. ${created} new, ${updated} updated. Catalog now holds ${total} items.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
