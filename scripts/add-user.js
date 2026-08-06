/**
 * Add a user without touching the database by hand.
 *   ADMIN_EMAIL=tech@communicationmall.com ADMIN_PASSWORD="..." ADMIN_NAME="Luis" ROLE=tech npm run user:add
 * ROLE is "admin" or "tech" (default). Re-running with the same email resets the password.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = process.env.ADMIN_NAME || 'Teammate';
  const role = process.env.ROLE === 'admin' ? 'admin' : 'tech';

  if (!email || password.length < 10) {
    throw new Error('Need ADMIN_EMAIL and an ADMIN_PASSWORD of 10+ characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, role },
    create: { email, passwordHash, name, role },
  });
  console.log(`${email} is ready as ${role}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
