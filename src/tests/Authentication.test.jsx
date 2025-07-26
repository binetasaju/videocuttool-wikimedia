import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import Authentication from '../components/Authentication';
import { GlobalContext } from '../context/GlobalContext';
import { UserContext } from '../context/UserContext';

describe('Authentication Component', () => {
  const mockGlobalContext = { updateAppState: vi.fn() };

  it('displays the login button when user is logged out', () => {
    const mockUserContext = {
      setCurrentUser: vi.fn(),
      currentUser: null,
    };

    render(
      <UserContext.Provider value={mockUserContext}>
        <GlobalContext.Provider value={mockGlobalContext}>
          <MemoryRouter>
            <Authentication />
          </MemoryRouter>
        </GlobalContext.Provider>
      </UserContext.Provider>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  it('displays the logout button when user is logged in', () => {
    const mockUserContext = {
      setCurrentUser: vi.fn(),
      currentUser: { username: 'Bineta' },
    };

    render(
      <UserContext.Provider value={mockUserContext}>
        <GlobalContext.Provider value={mockGlobalContext}>
          <MemoryRouter>
            <Authentication />
          </MemoryRouter>
        </GlobalContext.Provider> 
      </UserContext.Provider>
    );

    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });
});