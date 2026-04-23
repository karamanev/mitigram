import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

const contacts = [
  { id: 'contact_alice',   name: 'Alice Schmidt',          email: 'alice.schmidt@deutsche-bank.example-bank.com' },
  { id: 'contact_bob',     name: 'Bob Müller',              email: 'bob.mueller@commerzbank.example-bank.com' },
  { id: 'contact_carol',   name: 'Carol Dubois',            email: 'carol.dubois@bnp-paribas.example-bank.com' },
  { id: 'contact_david',   name: 'David Fontaine',          email: 'david.fontaine@societe-generale.example-bank.com' },
  { id: 'contact_elena',   name: 'Ελένη Παπαδοπούλου',     email: 'elena.papadopoulou@eurobank.example-bank.com' },
  { id: 'contact_frank',   name: 'Frank van den Berg',      email: 'frank.vandenberg@ing.example-bank.com' },
  { id: 'contact_grace',   name: "Grace O'Sullivan",        email: 'grace.osullivan@aib.example-bank.com' },
  { id: 'contact_hiro',    name: 'Hiroshi Tanaka',          email: 'h.tanaka@mizuho.example-bank.com' },
  { id: 'contact_ivan',    name: 'Ivan Petrov',             email: 'ivan.petrov@vtb.example-bank.com' },
  { id: 'contact_julia',   name: 'Julia Chen',              email: 'julia.chen+trade@icbc.example-bank.com' },
  { id: 'contact_kenji',   name: 'Kenji Nakamura',          email: 'kenji.nakamura@smbc.example-bank.com' },
  { id: 'contact_li',      name: 'Li Wei',                  email: 'li.wei@boc.example-bank.com' },
  { id: 'contact_maria',   name: 'María José García',       email: 'maria.garcia@santander.example-bank.com' },
  { id: 'contact_nathan',  name: 'Nathan Brooks',           email: 'n.brooks@jpmorgan.example-bank.com' },
  { id: 'contact_olivia',  name: 'Olivia Washington',       email: 'olivia.washington@bankofamerica.example-bank.com' },
  { id: 'contact_pierre',  name: 'Pierre Lefevre',          email: 'pierre.lefevre@credit-agricole.example-bank.com' },
  { id: 'contact_quinn',   name: 'Quinn Fitzgerald',        email: 'q.fitzgerald@citibank.example-bank.com' },
  { id: 'contact_rafael',  name: 'Rafael Souza',            email: 'rafael.souza@itau.example-bank.com' },
  { id: 'contact_sara',    name: 'Sara Lindqvist',          email: 'sara.lindqvist@nordea.example-bank.com' },
  { id: 'contact_thomas',  name: 'Thomas Keller',           email: 'thomas.keller@ubs.demo-corp.eu' },
] as const;

const groups = [
  {
    id: 'group_eu_banks',
    name: 'EU Banks',
    memberIds: [
      'contact_alice', 'contact_bob', 'contact_carol', 'contact_david',
      'contact_elena', 'contact_frank', 'contact_grace', 'contact_maria',
      'contact_pierre',
    ],
  },
  {
    id: 'group_asian_banks',
    name: 'Asian Banks',
    memberIds: ['contact_hiro', 'contact_julia', 'contact_kenji', 'contact_li'],
  },
  {
    id: 'group_us_banks',
    name: 'US Banks',
    memberIds: ['contact_nathan', 'contact_olivia', 'contact_quinn', 'contact_rafael'],
  },
  {
    // cross-cuts with all regional groups — drives dedup demo
    id: 'group_top_tier',
    name: 'Top Tier',
    memberIds: ['contact_alice', 'contact_hiro', 'contact_nathan', 'contact_thomas'],
  },
  {
    // small, overlaps with EU Banks and Asian Banks — exercises exclusion
    id: 'group_favourites',
    name: 'Favourites',
    memberIds: ['contact_alice', 'contact_julia', 'contact_sara', 'contact_ivan'],
  },
] as const;

async function main(): Promise<void> {
  console.log('Seeding database…');

  for (const contact of contacts) {
    await prisma.contact.upsert({
      where: { id: contact.id },
      update: { name: contact.name, email: contact.email },
      create: contact,
    });
  }

  for (const group of groups) {
    await prisma.group.upsert({
      where: { id: group.id },
      update: { name: group.name },
      create: { id: group.id, name: group.name },
    });

    // Remove stale memberships then recreate (idempotent)
    await prisma.groupMember.deleteMany({ where: { groupId: group.id } });
    await prisma.groupMember.createMany({
      data: group.memberIds.map((contactId) => ({
        contactId,
        groupId: group.id,
      })),
    });
  }

  console.log(
    `Seeded ${contacts.length} contacts and ${groups.length} groups.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
