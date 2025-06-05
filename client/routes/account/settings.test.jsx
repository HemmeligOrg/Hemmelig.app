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
// Remove getSsoSettings and updateSsoSettings from the mock
jest.mock('../../api/settings', () => ({
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
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

// mockSsoSettings is no longer needed as SSO UI is removed
// const mockSsoSettings = {
//     sso_client_id: 'initial_client_id',
//     sso_client_secret: 'initial_client_secret',
//     sso_authorization_url: 'https://initial.auth.url',
//     sso_token_url: 'https://initial.token.url',
//     sso_user_info_url: 'https://initial.userinfo.url',
//     sso_enabled: false,
// };

describe('Settings Component (Admin Account Settings)', () => {
    beforeEach(() => {
        // Reset mocks for each test
        useSettingsStore.mockReturnValue({
            setSettings: jest.fn(),
            settings: mockAdminSettings, // Provide some default settings state
        });
        // Setup mock return values for API calls
        settingsApi.getSettings.mockResolvedValue(mockAdminSettings); // This might be used if settings are fetched on mount, though useLoaderData is primary
        settingsApi.updateSettings.mockResolvedValue({ ...mockAdminSettings, restrict_organization_email: 'updated.com' });
        // Removed mocks for getSsoSettings and updateSsoSettings

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

    test('renders general settings form elements', () => {
        renderComponent();
        // The heading "settings.general_settings" might have been removed if it was only to differentiate from SSO.
        // If the main settings page still has a title or specific elements, test for those.
        // For now, directly check for some form elements.
        expect(screen.getByLabelText(/account.settings.read_only_mode/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/account.settings.disable_users/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/account.settings.disable_user_account_creation/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/account.settings.hide_allowed_ip_input/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/account.settings.disable_file_upload/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/account.settings.restrict_organization_email/i)).toBeInTheDocument();
        // The button text might have changed if "Update General" was specific to having an SSO section.
        // Assuming it's now just "settings.update" or similar.
        expect(screen.getByRole('button', { name: /settings.update/i })).toBeInTheDocument();
    });

    test('allows updating general settings', async () => {
        renderComponent();

        const readOnlyCheckbox = screen.getByLabelText(/account.settings.read_only_mode/i);
        // Assuming the button is now just "Update" or similar if "Update General" was too specific
        const updateButton = screen.getByRole('button', { name: /settings.update/i });

        // Ensure the checkbox initial state is as expected (false from mockAdminSettings)
        expect(readOnlyCheckbox).not.toBeChecked();

        fireEvent.click(readOnlyCheckbox); // Change a setting (check it)
        expect(readOnlyCheckbox).toBeChecked(); // Verify it's checked before submitting

        fireEvent.click(updateButton);

        await waitFor(() => {
            // Check that updateSettings was called with the formData including the change
            // The formData in the component will have read_only: true
            expect(settingsApi.updateSettings).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...mockAdminSettings, // includes all original settings
                    read_only: true, // the changed value
                })
            );
        });
    });

    // Removed all SSO specific tests:
    // - test('renders SSO configuration section and fields')
    // - test('loads initial SSO settings into the form')
    // - test('allows updating SSO settings')
    // - test('displays error message if fetching SSO settings fails')
    // - test('displays error message if updating SSO settings fails')

    test('displays error if useLoaderData returns an error', () => {
        const errorObj = { error: 'Failed to load settings', statusCode: 500 };
        jest.requireMock('react-router-dom').useLoaderData.mockReturnValue(errorObj);
        renderComponent();
        expect(screen.getByText(errorObj.error)).toBeInTheDocument();
    });

    test('displays error message if updateSettings API call fails', async () => {
        settingsApi.updateSettings.mockRejectedValueOnce(new Error('Update failed badly'));
        renderComponent();

        const updateButton = screen.getByRole('button', { name: /settings.update/i });
        fireEvent.click(updateButton);

        // Wait for error message to appear
        // This assumes your component sets an error state that's then rendered.
        // The exact text depends on how you handle and display errors.
        // For this example, let's assume it shows the error.message directly or a generic one.
        await screen.findByText(/Update failed badly/i); // Or a generic error message like t('something_went_wrong')
    });
});
