import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/prisma', () => ({
  default: {
    boxer: { findUnique: vi.fn() },
    club: { findUnique: vi.fn() },
    event: { findUnique: vi.fn() },
    fight: { create: vi.fn() },
  },
}));

import prisma from '../src/prisma';
import { create } from '../src/services/fight.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const boxer = (id: number, clubId: number, weightClassId = 1, status = 'active') =>
  ({ id, clubId, weightClassId, status });

const input = {
  boxer1Id: 1, boxer2Id: 2, eventId: 5, date: new Date('2026-01-10'),
  result: 'KO' as const, winnerId: 1, submittedById: 10, promoterId: 10,
};

function mockBoxers(b1: unknown, b2: unknown) {
  db.boxer.findUnique.mockImplementation(({ where }: { where: { id: number } }) =>
    Promise.resolve(where.id === 1 ? b1 : b2));
}

describe('fight.service create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.club.findUnique.mockResolvedValue({ id: 100 });
    db.event.findUnique.mockResolvedValue({ id: 5 });
    db.fight.create.mockResolvedValue({ id: 99, status: 'pending' });
  });

  it('creates a pending fight when all rules are met', async () => {
    mockBoxers(boxer(1, 100), boxer(2, 200));
    await expect(create(input)).resolves.toEqual({ id: 99, status: 'pending' });
    expect(db.fight.create).toHaveBeenCalledOnce();
  });

  it('returns 404 when a boxer does not exist', async () => {
    mockBoxers(boxer(1, 100), null);
    await expect(create(input)).rejects.toMatchObject({ status: 404 });
  });

  it('returns 403 when no boxer is from the promoter\'s club', async () => {
    mockBoxers(boxer(1, 300), boxer(2, 200));
    await expect(create(input)).rejects.toMatchObject({ status: 403 });
  });

  it('returns 422 when the boxers are in different weight classes', async () => {
    mockBoxers(boxer(1, 100, 1), boxer(2, 200, 2));
    await expect(create(input)).rejects.toMatchObject({ status: 422 });
  });

  it('returns 422 when a boxer is suspended', async () => {
    mockBoxers(boxer(1, 100), boxer(2, 200, 1, 'suspended'));
    await expect(create(input)).rejects.toMatchObject({ status: 422 });
  });

  it('returns 400 when a draw has a winner', async () => {
    mockBoxers(boxer(1, 100), boxer(2, 200));
    await expect(create({ ...input, result: 'draw' as never })).rejects.toMatchObject({ status: 400 });
  });

  it('returns 400 when a KO has no winner', async () => {
    mockBoxers(boxer(1, 100), boxer(2, 200));
    await expect(create({ ...input, winnerId: undefined })).rejects.toMatchObject({ status: 400 });
    expect(db.fight.create).not.toHaveBeenCalled();
  });
});
