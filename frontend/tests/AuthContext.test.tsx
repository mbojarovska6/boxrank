import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function Probe() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <p>{user ? `Logged in: ${user.role}` : 'Logged out'}</p>
      <button onClick={() => login('tok', { id: 1, email: 'a@boxrank.si', role: 'admin' })}>in</button>
      <button onClick={logout}>out</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('login stores the token and user', () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    fireEvent.click(screen.getByText('in'));
    expect(screen.getByText('Logged in: admin')).toBeTruthy();
    expect(localStorage.getItem('token')).toBe('tok');
  });

  it('logout removes the token and user', () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    fireEvent.click(screen.getByText('in'));
    fireEvent.click(screen.getByText('out'));
    expect(screen.getByText('Logged out')).toBeTruthy();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('useAuth throws outside AuthProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('useAuth mora biti znotraj AuthProvider');
  });
});
