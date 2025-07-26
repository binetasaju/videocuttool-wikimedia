import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom'; // Use real router components
import Home from '../pages/home';
import { vi } from 'vitest';
import { GlobalContext } from '../context/GlobalContext';
import { UserContext } from '../context/UserContext';
import { VideoDetailsContext } from '../context/VideoDetailsContext';
import ENV_SETTINGS from '../env';
import { Message } from '@wikimedia/react.i18n';

// Corrected mock for storage
vi.mock('../utils/storage', () => ({
  getCookies: vi.fn().mockReturnValue(null),
  clearItems: vi.fn(),
  getStoredItem: vi.fn().mockReturnValue(null),
}));

// Mock for socket.io remains the same
vi.mock('../utils/socket', () => ({
  socket: {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true
  }
}));

// DELETE THE vi.mock for 'react-router-dom' ENTIRELY

// Helper function to render component with all providers
const renderHome = () => {
  const mockContext = {
    appState: { current_step: 1, notifications: [] },
    updateAppState: vi.fn(),
    currentUser: null,
    setCurrentUser: vi.fn(),
    file: null,
    setFile: vi.fn(),
    videos: [],
    setVideos: vi.fn(),
    videoDetails: {},
    setVideoDetails: vi.fn(),
    videoUrl: '',
    setVideoUrl: vi.fn()
  };

  return render(
    <GlobalContext.Provider value={mockContext}>
      <UserContext.Provider value={mockContext}>
        <VideoDetailsContext.Provider value={mockContext}>
          {/* Use MemoryRouter for tests */}
          <MemoryRouter> 
            <Routes>
              <Route path="*" element={<Home />} />
            </Routes>
          </MemoryRouter>
        </VideoDetailsContext.Provider>
      </UserContext.Provider>
    </GlobalContext.Provider>
  );
};

describe('Home component', () => {
  it('should render without crashing', () => {
    renderHome();
    // Assuming the UrlBox component has a distinctive role or text
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  // You can add more specific tests for the Home component later
});