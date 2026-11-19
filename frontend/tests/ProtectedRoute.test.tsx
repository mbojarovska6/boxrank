import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import ProtectedRoute from '../src/components/ProtectedRoute';

function renderAt(roles?: string[]) {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<p>Home page</p>} />
          <Route path="/login" element={<p>Login page</p>} />
          <Route
            path="/admin"
            element={<ProtectedRoute roles={roles}><p>Secret page</p></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function logInAs(role: string) {
  localStorage.setItem('token', 'abc');
  localStorage.setItem('user', JSON.stringify({ id: 1, email: 'x@boxrank.si', role }));
}

describe('ProtectedRoute', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('redirects to /login when nobody is logged in', () => {
    renderAt(['admin']);
    expect(screen.getByText('Login page')).toBeTruthy();
  });

  it('redirects to / when the role is not allowed', () => {
    logInAs('promoter');
    renderAt(['admin']);
    expect(screen.getByText('Home page')).toBeTruthy();
  });

  it('shows the page when the role is allowed', () => {
    logInAs('admin');
    renderAt(['admin']);
    expect(screen.getByText('Secret page')).toBeTruthy();
  });

  it('shows the page to any logged-in user when no roles are given', () => {
    logInAs('boxer');
    renderAt();
    expect(screen.getByText('Secret page')).toBeTruthy();
  });
});
