/**
 * E2E tests for the Mitigram backend.
 *
 * DATABASE_URL is overridden to a separate test.db so the development
 * database is never touched. The schema is applied via `prisma db push`
 * in beforeAll, and the db file is deleted in afterAll.
 *
 * Run with:  npm run test:e2e  (from apps/backend)
 */

// Must be set before NestJS modules are imported — PrismaClient reads
// DATABASE_URL at construction time, which happens inside beforeAll when
// the testing module compiles.
process.env['DATABASE_URL'] = 'file:./test.db';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'supertest';

import { PrismaClient } from '../generated/client';
import { AppModule } from '../src/app.module';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const BACKEND_DIR = path.resolve(__dirname, '..');
const TEST_DB_PATH = path.join(BACKEND_DIR, 'test.db');

/**
 * Minimal dataset — enough to exercise every endpoint and edge case without
 * being noisy.  bob is intentionally in both groups to verify that a contact
 * appearing in multiple groups is returned in each of them.
 */
const TEST_CONTACTS = [
  { id: 'tc_alice', name: 'Alice Tester', email: 'alice@e2e.example.com' },
  { id: 'tc_bob',   name: 'Bob Tester',   email: 'bob@e2e.example.com' },
  { id: 'tc_carol', name: 'Carol Tester', email: 'carol@e2e.example.com' },
  { id: 'tc_david', name: 'David Tester', email: 'david@e2e.example.com' },
] as const;

const TEST_GROUPS = [
  {
    id: 'tg_alpha',
    name: 'Alpha Group',
    memberIds: ['tc_alice', 'tc_bob', 'tc_carol'],
  },
  {
    id: 'tg_beta',
    name: 'Beta Group',
    memberIds: ['tc_bob', 'tc_david'], // bob is shared with Alpha
  },
] as const;

// ─── Global setup / teardown ──────────────────────────────────────────────────

let app: INestApplication;
let prisma: PrismaClient;

beforeAll(async () => {
  // 1. Apply the Prisma schema to a fresh test database.
  //    --force-reset drops any existing test.db data.
  //    --skip-generate avoids regenerating the client (already generated).
  execSync('npx prisma db push --force-reset --skip-generate', {
    cwd: BACKEND_DIR,
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'pipe',
  });

  // 2. Seed minimal known data so assertions are deterministic.
  prisma = new PrismaClient();
  await prisma.$connect();

  for (const c of TEST_CONTACTS) {
    await prisma.contact.upsert({
      where: { id: c.id },
      update: { name: c.name, email: c.email },
      create: c,
    });
  }

  for (const g of TEST_GROUPS) {
    await prisma.group.upsert({
      where: { id: g.id },
      update: { name: g.name },
      create: { id: g.id, name: g.name },
    });
    await prisma.groupMember.deleteMany({ where: { groupId: g.id } });
    await prisma.groupMember.createMany({
      data: g.memberIds.map((contactId) => ({ contactId, groupId: g.id })),
    });
  }

  // 3. Boot the NestJS app with the same global configuration as main.ts.
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = module.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.init();
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
  // Remove test database so it doesn't linger between CI runs.
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

// Wipe invitations after each test so POST tests don't bleed into one another.
afterEach(async () => {
  await prisma.invitation.deleteMany();
});

// ─── GET /api/contacts ────────────────────────────────────────────────────────

describe('GET /api/contacts', () => {
  it('responds with 200', () => {
    return request(app.getHttpServer()).get('/api/contacts').expect(200);
  });

  it('returns an array with all seeded contacts', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/contacts')
      .expect(200);

    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(TEST_CONTACTS.length);
  });

  it('each contact has exactly id, name, email — no extra fields', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/contacts')
      .expect(200);

    for (const contact of body) {
      expect(Object.keys(contact).sort()).toEqual(['email', 'id', 'name']);
      expect(typeof contact.id).toBe('string');
      expect(typeof contact.name).toBe('string');
      expect(typeof contact.email).toBe('string');
    }
  });

  it('results are sorted alphabetically by name', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/contacts')
      .expect(200);

    const names: string[] = body.map((c: { name: string }) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('includes all seeded contact IDs', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/contacts')
      .expect(200);

    const ids: string[] = body.map((c: { id: string }) => c.id);
    for (const { id } of TEST_CONTACTS) {
      expect(ids).toContain(id);
    }
  });

  it('contact emails match the seeded values', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/contacts')
      .expect(200);

    const alice = body.find((c: { id: string }) => c.id === 'tc_alice');
    expect(alice).toBeDefined();
    expect(alice.email).toBe('alice@e2e.example.com');
  });
});

// ─── GET /api/groups ──────────────────────────────────────────────────────────

describe('GET /api/groups', () => {
  it('responds with 200', () => {
    return request(app.getHttpServer()).get('/api/groups').expect(200);
  });

  it('returns an array with all seeded groups', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/groups')
      .expect(200);

    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(TEST_GROUPS.length);
  });

  it('each group has id, name, and a members array', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/groups')
      .expect(200);

    for (const group of body) {
      expect(typeof group.id).toBe('string');
      expect(typeof group.name).toBe('string');
      expect(Array.isArray(group.members)).toBe(true);
    }
  });

  it('each member has exactly id, name, email', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/groups')
      .expect(200);

    for (const group of body) {
      for (const member of group.members) {
        expect(Object.keys(member).sort()).toEqual(['email', 'id', 'name']);
      }
    }
  });

  it('groups are sorted alphabetically by name', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/groups')
      .expect(200);

    const names: string[] = body.map((g: { name: string }) => g.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('Alpha Group contains alice, bob, carol (3 members)', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/groups')
      .expect(200);

    const alpha = body.find((g: { id: string }) => g.id === 'tg_alpha');
    expect(alpha).toBeDefined();
    expect(alpha.members).toHaveLength(3);

    const memberIds: string[] = alpha.members.map((m: { id: string }) => m.id);
    expect(memberIds).toEqual(
      expect.arrayContaining(['tc_alice', 'tc_bob', 'tc_carol']),
    );
  });

  it('Beta Group contains bob, david (2 members)', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/groups')
      .expect(200);

    const beta = body.find((g: { id: string }) => g.id === 'tg_beta');
    expect(beta).toBeDefined();
    expect(beta.members).toHaveLength(2);

    const memberIds: string[] = beta.members.map((m: { id: string }) => m.id);
    expect(memberIds).toEqual(expect.arrayContaining(['tc_bob', 'tc_david']));
  });

  it('a contact in multiple groups appears in each of them', async () => {
    // bob is in both tg_alpha and tg_beta
    const { body } = await request(app.getHttpServer())
      .get('/api/groups')
      .expect(200);

    const alpha = body.find((g: { id: string }) => g.id === 'tg_alpha');
    const beta = body.find((g: { id: string }) => g.id === 'tg_beta');

    const alphaIds: string[] = alpha.members.map((m: { id: string }) => m.id);
    const betaIds: string[] = beta.members.map((m: { id: string }) => m.id);

    expect(alphaIds).toContain('tc_bob');
    expect(betaIds).toContain('tc_bob');
  });

  it('member email matches the contact record', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/groups')
      .expect(200);

    const alpha = body.find((g: { id: string }) => g.id === 'tg_alpha');
    const alice = alpha.members.find((m: { id: string }) => m.id === 'tc_alice');
    expect(alice.email).toBe('alice@e2e.example.com');
  });
});

// ─── POST /api/instruments/:id/invitations ────────────────────────────────────

describe('POST /api/instruments/:id/invitations', () => {
  // ── Happy path ──────────────────────────────────────────────────────────────

  it('returns 201 with a valid single-email body', () => {
    return request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: ['alice@e2e.example.com'] })
      .expect(201);
  });

  it('response contains id, instrumentId, emails, sentAt', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: ['alice@e2e.example.com'] })
      .expect(201);

    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);
    expect(body.instrumentId).toBe('inst_001');
    expect(body.emails).toEqual(['alice@e2e.example.com']);
    expect(typeof body.sentAt).toBe('string');
  });

  it('instrumentId in response matches the URL param', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/instruments/my-special-instrument/invitations')
      .send({ emails: ['test@example.com'] })
      .expect(201);

    expect(body.instrumentId).toBe('my-special-instrument');
  });

  it('accepts multiple emails and echoes them in the response', async () => {
    const emails = [
      'alice@e2e.example.com',
      'bob@e2e.example.com',
      'carol@e2e.example.com',
    ];

    const { body } = await request(app.getHttpServer())
      .post('/api/instruments/inst_002/invitations')
      .send({ emails })
      .expect(201);

    expect(body.emails).toEqual(emails);
  });

  it('sentAt is a valid ISO-8601 timestamp close to now', async () => {
    const before = Date.now();

    const { body } = await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: ['time@example.com'] })
      .expect(201);

    const after = Date.now();
    const sentAt = new Date(body.sentAt).getTime();

    // Must round-trip as ISO string
    expect(new Date(body.sentAt).toISOString()).toBe(body.sentAt);
    // Must fall within the test window
    expect(sentAt).toBeGreaterThanOrEqual(before);
    expect(sentAt).toBeLessThanOrEqual(after);
  });

  it('each call produces a unique id', async () => {
    const [r1, r2] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/instruments/inst_001/invitations')
        .send({ emails: ['x@example.com'] }),
      request(app.getHttpServer())
        .post('/api/instruments/inst_001/invitations')
        .send({ emails: ['y@example.com'] }),
    ]);

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(r1.body.id).not.toBe(r2.body.id);
  });

  it('works with ad-hoc emails not in the address book', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: ['adhoc@totally-new-domain.io'] })
      .expect(201);

    expect(body.emails).toEqual(['adhoc@totally-new-domain.io']);
  });

  it('accepts emails with + aliases', async () => {
    await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: ['user+tag@example.com'] })
      .expect(201);
  });

  // ── Validation — 400 cases ───────────────────────────────────────────────────

  it('returns 400 when emails is an empty array', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: [] })
      .expect(400);

    expect(body.statusCode).toBe(400);
  });

  it('returns 400 when emails field is missing entirely', async () => {
    await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({})
      .expect(400);
  });

  it('returns 400 when emails contains a non-email string', async () => {
    await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: ['not-an-email'] })
      .expect(400);
  });

  it('returns 400 when emails mixes valid and invalid entries', async () => {
    await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: ['valid@example.com', 'oops'] })
      .expect(400);
  });

  it('returns 400 when emails is a plain string instead of an array', async () => {
    await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: 'alice@e2e.example.com' })
      .expect(400);
  });

  it('returns 400 when emails is a number', async () => {
    await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: 42 })
      .expect(400);
  });

  it('returns 400 when an unknown extra field is present (forbidNonWhitelisted)', async () => {
    await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: ['alice@e2e.example.com'], unknown: 'field' })
      .expect(400);
  });

  it('400 response body contains a message array describing the error', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/instruments/inst_001/invitations')
      .send({ emails: [] })
      .expect(400);

    expect(body).toMatchObject({
      statusCode: 400,
      message: expect.arrayContaining([expect.any(String)]),
    });
  });
});
