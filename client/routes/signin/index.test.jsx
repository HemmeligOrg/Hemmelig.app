import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n'; // Assuming your i18n setup is here
import SignIn from './index';
import useAuthStore from '../../stores/authStore';
import useSettingsStore from '../../stores/settingsStore';

// Mock stores
jest.mock('../../stores/authStore');
jest.mock('../../stores/settingsStore');
// Mock any API calls if necessary, though for this test, not directly testing signIn API
jest.mock('../../api/authentication', () => ({
    signIn: jest.fn(),
}));

// Mock window.location.href
const originalLocation = window.location;
beforeAll(() => {
    delete window.location;
    window.location = { href: '', assign: jest.fn(), replace: jest.fn() };
});
afterAll(() => {
    window.location = originalLocation;
});


describe('SignIn Component', () => {
    beforeEach(() => {
        // Reset mocks for each test
        useAuthStore.mockReturnValue({ setLogin: jest.fn() });
        useSettingsStore.mockReturnValue({
            settings: {
                disable_users: false, // Ensure users are not disabled for these tests
            },
        });
        window.location.href = ''; // Reset href
        window.location.assign = jest.fn();
    });

    const renderComponent = () => {
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <SignIn />
                </MemoryRouter>
            </I18nextProvider>
        );
    };

    test('renders the standard sign-in form elements', () => {
        renderComponent();
        expect(screen.getByPlaceholderText('signin.username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('signin.password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /signin.signin/i })).toBeInTheDocument();
    });

    test('renders the "Sign in with SSO" button', () => {
        renderComponent();
        // Assuming the translation key for "Sign in with SSO" is 'signin.sso_signin'
        // The button text might also include an icon, so using a flexible matcher.
        const ssoButton = screen.getByRole('button', { name: /signin.sso_signin/i });
        expect(ssoButton).toBeInTheDocument();
    });

    test('clicking "Sign in with SSO" button redirects to /auth/oauth2', () => {
        renderComponent();
        const ssoButton = screen.getByRole('button', { name: /signin.sso_signin/i });

        fireEvent.click(ssoButton);

        // Check if window.location.href was changed to the correct path
        expect(window.location.href).toBe('/auth/oauth2');
    });

    test('does not render form if users are disabled', () => {
        useSettingsStore.mockReturnValue({
            settings: {
                disable_users: true,
            },
        });
        renderComponent();
        expect(screen.queryByPlaceholderText('signin.username')).not.toBeInTheDocument();
        expect(screen.getByText('signin.users_disabled')).toBeInTheDocument(); // Assuming this message is shown
    });
});
