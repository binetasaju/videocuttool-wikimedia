// src/tests/Header.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import Header from '../components/Header';
import { GlobalContext } from '../context/GlobalContext';
import { UserContext } from '../context/UserContext'; // <--- 1. Import UserContext

// Mock the i18n Message component
vi.mock('@wikimedia/react.i18n', () => ({
  Message: ({ id }) => <span>{id}</span>,
}));

describe('Header Component', () => {
  it('should render the logo image', () => {
    // Arrange: Setup mock contexts
    const mockGlobalContext = {
      appState: { themeMode: 'light' },
      updateAppState: vi.fn(),
    };
    // --- 2. Create a mock value for UserContext ---
    const mockUserContext = {
      setCurrentUser: vi.fn(),
      currentUser: null, // Simulate a logged-out user
    };

    // Act: Render the component with all necessary providers
    render(
      // --- 3. Wrap with UserContext.Provider ---
      <UserContext.Provider value={mockUserContext}>
        <GlobalContext.Provider value={mockGlobalContext}>
          <MemoryRouter>
            <Header />
          </MemoryRouter>
        </GlobalContext.Provider>
      </UserContext.Provider>
    );

    // Assert
    const logoImage = screen.getByAltText('logo');
    expect(logoImage).toBeInTheDocument();
  });
});