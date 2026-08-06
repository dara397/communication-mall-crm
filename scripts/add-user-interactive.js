/** Prompts for a new user. Run via the ADD-A-USER double-click. */
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  console.log('');
  console.log('  ADD SOMEONE TO THE CRM');
  console.log('  ----------------------');
  console.log('');

  const name = (await rl.question('  Their full name:        ')).trim();
  const email = (await rl.question('  Their email:            ')).trim().toLowerCase();
  const password = (await rl.question('  A password for them:    ')).trim();
  const adminAnswer = (await rl.question('  Make them an admin? (y/n) ')).trim().toLowerCase();
  rl.close();

  if (!name) throw new Error('You have to give them a name.');
  if (!email.includes('@')) throw new Error("That doesn't look like an email address.");
  if (password.length < 10) throw new Error('The password needs at least 10 characters.');

  const role = adminAnswer.startsWith('y') ? 'admin' : 'tech';
  const existing = await prisma.user.findUnique({ where: { email } });

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(password, 12), name, role },
    create: { email, passwordHash: await bcrypt.hash(password, 12), name, role },
  });

  console.log('');
  console.log('  ============================================');
  if (existing) {
    console.log(`  ${name}'s password has been RESET.`);
  } else {
    console.log(`  ${name} can now sign in.`);
  }
  console.log('');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Access:   ${role === 'admin' ? 'Admin (can change settings, delete records)' : 'Tech (quotes, orders, invoices, payments)'}`);
  console.log('  ============================================');
  console.log('');
  console.log('  Give them those details. They sign in at the');
  console.log('  same address everyone else uses.');
  console.log('');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.log('');
    console.log(`  X  ${e.message}`);
    console.log('');
    await prisma.$disconnect();
    process.exitCode = 1;
  });
