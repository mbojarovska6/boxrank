import { describe, it, expect, vi, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { authenticate, requireRole } from '../src/middleware/auth.middleware';

function mockRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response & { status: ReturnType<typeof vi.fn> };
}

describe('auth middleware', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('authenticate returns 401 without a token', () => {
    const res = mockRes();
    const next = vi.fn();
    authenticate({ headers: {} } as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('authenticate returns 401 for an invalid token', () => {
    const res = mockRes();
    const next = vi.fn();
    authenticate({ headers: { authorization: 'Bearer wrong' } } as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('authenticate sets req.user for a valid token', () => {
    const token = jwt.sign({ id: 1, email: 'a@b.si', role: 'admin' }, 'test-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const next = vi.fn();
    authenticate(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ id: 1, role: 'admin' });
  });

  it('requireRole returns 403 for a wrong role', () => {
    const res = mockRes();
    const next = vi.fn();
    requireRole('admin')({ user: { id: 2, email: 'p@b.si', role: 'promoter' } } as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('requireRole calls next for an allowed role', () => {
    const next = vi.fn();
    requireRole('admin', 'promoter')({ user: { id: 2, email: 'p@b.si', role: 'promoter' } } as Request, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });
});
