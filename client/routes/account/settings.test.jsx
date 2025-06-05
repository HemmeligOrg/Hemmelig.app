import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n'; // Assuming your i18n setup
import Settings from './settings'; // The component to test
import useSettingsStore from '../../stores/settingsStore';
import * as settingsApi from '../../api/settings'; // To mock API functions

// Mock stores
jest.mock('../../stores/settingsStore');

// Mock API functions
jest.mock('../../api/settings', () => ({
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    getSsoSettings: jest.fn(),
    updateSsoSettings: jest.fn(),
}));

// Mock react-router-dom's useLoaderData
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'), // import and retain default behavior
    useLoaderData: jest.fn(),
}));

const mockAdminSettings = {
    disable_users: false,
    disable_user_account_creation: false,
    read_only: false,
    disable_file_upload: false,
    restrict_organization_email: '',
    hide_allowed_ip_input: false,
};

const mockSsoSettings = {
    sso_client_id: 'initial_client_id',
    sso_client_secret: 'initial_client_secret',
    sso_authorization_url: 'https://initial.auth.url',
    sso_token_url: 'https://initial.token.url',
    sso_user_info_url: 'https://initial.userinfo.url',
    sso_enabled: false,
};

describe('Settings Component (Admin Account Settings)', () => {
    beforeEach(() => {
        // Reset mocks for each test
        useSettingsStore.mockReturnValue({
            setSettings: jest.fn(),
            settings: mockAdminSettings, // Provide some default settings state
        });
        // Setup mock return values for API calls
        settingsApi.getSettings.mockResolvedValue(mockAdminSettings);
        settingsApi.updateSettings.mockResolvedValue({ ...mockAdminSettings, restrict_organization_email: 'updated.com' });
        settingsApi.getSsoSettings.mockResolvedValue(mockSsoSettings);
        settingsApi.updateSsoSettings.mockResolvedValue({ ...mockSsoSettings, sso_enabled: true, sso_client_id: 'updated_client_id' });

        // Mock useLoaderData to return admin settings (as if loaded by router)
        jest.requireMock('react-router-dom').useLoaderData.mockReturnValue(mockAdminSettings);
    });

    const renderComponent = () => {
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <Settings />
                </MemoryRouter>
            </I18nextProvider>
        );
    };

    test('renders general settings form elements', async () => {
        renderComponent();
        // Wait for any async operations like useEffect fetching SSO settings to complete
        await screen.findByText('settings.general_settings');

        expect(screen.getByLabelText(/account.settings.read_only_mode/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/account.settings.disable_users/i)).toBeInTheDocument();
        // Add more checks for other general settings if needed
    });

    test('renders SSO configuration section and fields', async () => {
        renderComponent();
        await screen.findByText('settings.sso.title'); // Wait for SSO section

        expect(screen.getByLabelText(/settings.sso.enable/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/settings.sso.client_id/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/settings.sso.client_secret/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/settings.sso.authorization_url/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/settings.sso.token_url/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/settings.sso.user_info_url/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /settings.sso.update_sso/i})).toBeInTheDocument();
    });

    test('loads initial SSO settings into the form', async () => {
        renderComponent();
        await screen.findByDisplayValue(mockSsoSettings.sso_client_id);

        expect(screen.getByLabelText(/settings.sso.enable/i)).not.toBeChecked(); // sso_enabled is false initially
        expect(screen.getByLabelText(/settings.sso.client_id/i)).toHaveValue(mockSsoSettings.sso_client_id);
        expect(screen.getByLabelText(/settings.sso.client_secret/i)).toHaveValue(mockSsoSettings.sso_client_secret);
        expect(screen.getByLabelText(/settings.sso.authorization_url/i)).toHaveValue(mockSsoSettings.sso_authorization_url);
        expect(screen.getByLabelText(/settings.sso.token_url/i)).toHaveValue(mockSsoSettings.sso_token_url);
        expect(screen.getByLabelText(/settings.sso.user_info_url/i)).toHaveValue(mockSsoSettings.sso_user_info_url);
    });

    test('allows updating SSO settings', async () => {
        renderComponent();
        await screen.findByDisplayValue(mockSsoSettings.sso_client_id); // Ensure form is loaded

        const clientIdInput = screen.getByLabelText(/settings.sso.client_id/i);
        const enableSsoCheckbox = screen.getByLabelText(/settings.sso.enable/i);
        const updateSsoButton = screen.getByRole('button', { name: /settings.sso.update_sso/i });

        // Modify values
        fireEvent.click(enableSsoCheckbox); // Enable SSO
        fireEvent.change(clientIdInput, { target: { value: 'new_sso_client_id' } });

        fireEvent.click(updateSsoButton);

        // Check if updateSsoSettings was called with the correct data
        await waitFor(() => {
            expect(settingsApi.updateSsoSettings).toHaveBeenCalledWith({
                ...mockSsoSettings, // original values for non-changed fields
                sso_enabled: true,
                sso_client_id: 'new_sso_client_id',
            });
        });

        // Check for success message (optional, based on your component's behavior)
        // await screen.findByText('settings.sso.updated');
    });

    test('allows updating general settings', async () => {
        renderComponent();
        await screen.findByText('settings.general_settings');

        const readOnlyCheckbox = screen.getByLabelText(/account.settings.read_only_mode/i);
        const updateGeneralButton = screen.getByRole('button', { name: /settings.update_general/i });

        fireEvent.click(readOnlyCheckbox); // Change a setting
        fireEvent.click(updateGeneralButton);

        await waitFor(() => {
            expect(settingsApi.updateSettings).toHaveBeenCalledWith(
                expect.objectContaining({
                    read_only: true, // Assuming it was false initially in mockAdminSettings
                })
            );
        });
    });

    test('displays error message if fetching SSO settings fails', async () => {
        settingsApi.getSsoSettings.mockRejectedValueOnce(new Error('Failed to fetch SSO'));
        renderComponent();
        // Check for an error message being displayed related to SSO fetching
        await screen.findByText(/settings.sso.fetch_error/i); // Or whatever error message you expect
    });

    test('displays error message if updating SSO settings fails', async () => {
        settingsApi.updateSsoSettings.mockRejectedValueOnce(new Error('Update failed'));
        renderComponent();
        await screen.findByDisplayValue(mockSsoSettings.sso_client_id); // Ensure form is loaded

        const updateSsoButton = screen.getByRole('button', { name: /settings.sso.update_sso/i });
        fireEvent.click(updateSsoButton);

        // Check for an error message being displayed related to SSO update
        await screen.findByText(/Update failed/i); // Or a translated message
    });

});
