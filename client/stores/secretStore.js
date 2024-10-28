import passwordGenerator from 'generate-password-browser';
import { create } from 'zustand';
import { encrypt, generateKey } from '../../shared/helpers/crypto';
import { createSecret } from '../api/secret';
import { zipFiles } from '../helpers/zip';

const DEFAULT_TTL = 259200; // 3 days

const initialFormData = {
    text: '',
    title: '',
    maxViews: 1,
    files: [],
    password: '',
    ttl: DEFAULT_TTL,
    allowedIp: '',
    preventBurn: false,
    isPublic: false,
    burnAfterReading: true,
    burnAfterTime: false,
};

const initialErrors = {
    banner: {
        title: '',
        message: '',
        dismissible: true,
    },
    fields: {},
    sections: {},
};

export const useSecretStore = create((set, get) => ({
    // Form Data
    formData: initialFormData,
    setFormData: (updates) =>
        set((state) => ({
            formData:
                typeof updates === 'function'
                    ? updates(state.formData)
                    : { ...state.formData, ...updates },
        })),

    // UI State
    ttl: DEFAULT_TTL,
    setTTL: (value) => set({ ttl: value }),

    enablePassword: false,
    setEnablePassword: (value) =>
        set((state) => {
            // Generate or clear password when toggling
            const newPassword = value
                ? passwordGenerator.generate({
                      length: 16,
                      numbers: true,
                      strict: true,
                      symbols: true,
                  })
                : '';

            return {
                enablePassword: value,
                formData: {
                    ...state.formData,
                    password: newPassword,
                },
            };
        }),

    isPublic: false,
    setIsPublic: (value) => set({ isPublic: value }),

    creatingSecret: false,
    setCreatingSecret: (value) => set({ creatingSecret: value }),

    // Errors
    errors: initialErrors,
    setErrors: (updates) =>
        set((state) => ({
            errors:
                typeof updates === 'function'
                    ? updates(state.errors)
                    : { ...state.errors, ...updates },
        })),

    // Result State
    secretId: '',
    setSecretId: (value) => set({ secretId: value }),

    encryptionKey: '',
    setEncryptionKey: (value) => set({ encryptionKey: value }),

    // Actions
    reset: () =>
        set({
            formData: initialFormData,
            secretId: '',
            encryptionKey: '',
            enablePassword: false,
            creatingSecret: false,
            ttl: DEFAULT_TTL,
            isPublic: false,
            errors: initialErrors,
        }),

    // File handling
    removeFile: (index) =>
        set((state) => {
            const updatedFiles = [...state.formData.files];
            updatedFiles.splice(index, 1);
            return {
                formData: {
                    ...state.formData,
                    files: updatedFiles,
                },
            };
        }),

    // Form submission
    handleSubmit: async (event, t) => {
        event.preventDefault();

        const state = get();
        if (state.creatingSecret) return;

        set({ creatingSecret: true });

        try {
            let encryptedText = state.formData.text;
            let key = '';

            // Only encrypt if not public
            if (!state.isPublic) {
                key = generateKey();
                encryptedText = await encrypt(state.formData.text, key);
            }

            // Handle file uploads if present
            let encryptedFiles = [];
            if (state.formData.files.length > 0) {
                const zippedFiles = await zipFiles(state.formData.files);
                if (!state.isPublic) {
                    encryptedFiles = await encrypt(zippedFiles, key);
                } else {
                    encryptedFiles = zippedFiles;
                }
            }

            // Prepare payload
            const payload = {
                text: encryptedText,
                title: state.formData.title,
                ttl: parseInt(state.ttl),
                maxViews: parseInt(state.formData.maxViews),
                files: encryptedFiles,
                password: state.enablePassword ? state.formData.password : '',
                burnAfterReading: state.formData.burnAfterReading,
                burnAfterTime: state.formData.burnAfterTime,
                isPublic: state.isPublic,
            };

            // Create secret
            const { id } = await createSecret(payload);

            // Update store with new secret info
            set({
                secretId: id,
                encryptionKey: key,
                errors: initialErrors,
            });
        } catch (error) {
            console.error('Error creating secret:', error);

            set({
                errors: {
                    banner: {
                        title: t('error'),
                        message: t('error_creating_secret'),
                        dismissible: true,
                    },
                    fields: {},
                    sections: {},
                },
            });
        } finally {
            set({ creatingSecret: false });
        }
    },

    onEnablePassword: () => {
        // Get current state
        const { enablePassword, setEnablePassword, setFormData } = get();
        const newEnablePassword = !enablePassword;

        setEnablePassword(newEnablePassword);

        if (newEnablePassword) {
            const newPassword = passwordGenerator.generate({
                length: 16,
                numbers: true,
                strict: true,
                symbols: true,
            });
            setFormData((prev) => ({ ...prev, password: newPassword }));
        } else {
            setFormData((prev) => ({ ...prev, password: '' }));
        }
    },
}));
