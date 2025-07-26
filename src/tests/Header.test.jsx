    import { render, screen, fireEvent, cleanup } from '@testing-library/react';
    import React from 'react'; // React itself is needed for JSX
    import { GlobalContext } from '../context/GlobalContext'; // Your GlobalContext
    import Header from '../components/Header'; // The Header component you modified

    // --- Mocks for external dependencies using Jest syntax ---

    // Mock react-router-dom's useNavigate hook
    // This allows us to check if navigate('/') was called without a full router setup.
    jest.mock('react-router-dom', () => ({
      // We're providing a mock implementation for useNavigate
      useNavigate: jest.fn(),
    }));

    // Mock react-bootstrap components (like Image) to prevent rendering issues in tests.
    jest.mock('react-bootstrap', () => ({
      Image: jest.fn(({ alt, src, width, height }) => (
        <img alt={alt} src={src} width={width} height={height} data-testid="mock-logo-image" />
      )),
      // You might need to add mocks for other react-bootstrap components if they cause errors.
      // Example: OverlayTrigger: ({ children }) => <div>{children}</div>,
      // Example: Dropdown: ({ children }) => <div>{children}</div>,
    }));

    // Mock the Message component from @wikimedia/react.i18n, as it's used in the <h1>.
    jest.mock('@wikimedia/react.i18n', () => ({
      Message: ({ id }) => <span>{id}</span>, // Simple mock: just renders the id prop's value
    }));

    // Mock other direct imports that are not the focus of this test,
    // to ensure the Header component renders without errors from unhandled imports.
    jest.mock('../logo.svg', () => 'mock-logo.svg'); // For image imports
    jest.mock('../utils/languages', () => ({ localesList: {} })); // For language data
    jest.mock('./Authentication', () => ({ default: () => <div>Mock Authentication</div> }));
    jest.mock('./DarkModeToggle', () => ({ default: () => <div>Mock DarkModeToggle</div> }));
    jest.mock('./GeneralPopover', () => ({ default: () => <div>Mock GeneralPopover</div> }));
    jest.mock('../language-dark.svg', () => 'mock-lang-dark.svg');
    jest.mock('../language-light.svg', () => 'mock-lang-light.svg');


    // --- Test Cleanup ---
    // This function runs after each test to clean up the rendered React components
    // and reset the state of our mock functions.
    afterEach(() => {
      cleanup(); // Cleans up the DOM rendered by @testing-library/react
      jest.clearAllMocks(); // Resets all mock functions (like useNavigate, setUploadedVideo)
    });

    // --- Test Suite Definition ---
    // 'describe' groups related tests together.
    describe('Header Component', () => {

      // --- Individual Test Case ---
      // 'test' (or 'it') defines a single test scenario.
      test('logo/title click resets uploadedVideo and navigates to homepage', () => {
        // 1. Get the mocked useNavigate function from its module.
        // We need this reference to assert on its calls later.
        const useNavigate = require('react-router-dom').useNavigate;

        // 2. Prepare mock values for GlobalContext.
        // We simulate the appState and provide mock functions for updateAppState and setUploadedVideo.
        const mockAppState = {
          current_locale: { locale: 'en-US', name: 'English', native_name: 'English' },
          themeMode: 'light',
          // Add any other appState properties that the Header component directly uses
          // and needs to have a value for the test to run without errors.
        };
        const mockUpdateAppState = jest.fn(); // A mock function for updateAppState
        const mockSetUploadedVideo = jest.fn(); // The mock function for setUploadedVideo, which we will assert on!

        // 3. Render the Header component.
        // We wrap it in GlobalContext.Provider to mimic the real application environment,
        // passing our mocked values into the context.
        render(
          <GlobalContext.Provider value={{
            appState: mockAppState,
            updateAppState: mockUpdateAppState,
            setUploadedVideo: mockSetUploadedVideo, // Provide our mocked setUploadedVideo here
          }}>
            <Header apiUrl="http://mockapi.com" /> {/* Pass any props the Header expects */}
          </GlobalContext.Provider>
        );

        // 4. Find the clickable logo element.
        // We use screen.getByRole to find the element by its accessible role ('button')
        // and its accessible name (which is 'title' from the <Message id="title" />).
        const logoWrapper = screen.getByRole('button', { name: /title/i });

        // 5. Simulate a click event on the found logo element.
        fireEvent.click(logoWrapper);

        // 6. Make Assertions: Verify that the expected actions occurred.

        // Assert that mockSetUploadedVideo was called exactly once and with the value 0.
        expect(mockSetUploadedVideo).toHaveBeenCalledTimes(1);
        expect(mockSetUploadedVideo).toHaveBeenCalledWith(0);

        // Assert that useNavigate (our mocked version) was called exactly once and with the path '/'.
        expect(useNavigate).toHaveBeenCalledTimes(1);
        expect(useNavigate).toHaveBeenCalledWith('/');
      });

      // You can add more 'test' blocks here for other functionalities of the Header component.
    });
    