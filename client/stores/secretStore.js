import { generate } from 'generate-password-browser';
import { create } from 'zustand';
import { encrypt, generateKey } from '../../shared/helpers/crypto';
import { createSecret } from '../api/secret';
import { zipFiles } from '../helpers/zip';

const initialErrors = {
    banner: { title: '', message: '', dismissible: true },
    fields: { text: '', title: '' },
    sections: { files: '' },
};

const defaultValues = {
    formData: {
        allowedIp: '',
        text: '',
        title: '',
        password: '',
        files: [],
        maxViews: 1,
        preventBurn: false,
        ttl: 3600,
    },
    enablePassword: false,
    isPublic: false,
    creatingSecret: false,
    errors: {
        banner: { title: '', message: '', dismissible: true },
        fields: { text: '', title: '' },
        sections: { files: '' },
    },
    secretId: null,
    encryptionKey: '',
};

const useSecretStore = create((set, get) => ({
    ...defaultValues,
    setField: (field, value) =>
        set((state) => {
            if (field.startsWith('formData.')) {
                const formField = field.split('.')[1];
                return {
                    formData: {
                        ...state.formData,
                        [formField]: value,
                    },
                };
            }
            if (field.startsWith('errors.')) {
                const [category, subfield] = field.split('.').slice(1);
                return {
                    errors: {
                        ...state.errors,
                        [category]: {
                            ...state.errors[category],
                            [subfield]: value,
                        },
                    },
                };
            }
            return { [field]: value };
        }),
    reset: () => set(defaultValues),
    removeFile: (index) =>
        set((state) => {
            const files = [...state.formData.files];
            files.splice(index, 1);
            const newFiles = {
                formData: {
                    ...state.formData,
                    files,
                },
            };
            return newFiles;
        }),
    handleSubmit: async (event, t) => {
        event.preventDefault();

        const state = get();
        if (state.creatingSecret) return;

        set({ creatingSecret: true });

        try {
            let encryptedText = state.formData.text;
            let key = '';

            if (!state.isPublic) {
                key = generateKey();
                encryptedText = await encrypt(state.formData.text, key);
            }

            const encryptedFiles = [];
            if (state.formData.files.length > 0) {
                const zippedFiles = await zipFiles(state.formData.files);
                const encryptZip = await encrypt(zippedFiles, key);

                encryptedFiles.push({
                    content: encryptZip,
                    ext: 'zip',
                    type: 'application/zip',
                });
            }

            const payload = {
                allowedIp: state.formData.allowedIp,
                text: encryptedText,
                title: state.formData.title,
                ttl: parseInt(state.formData.ttl),
                maxViews: parseInt(state.formData.maxViews),
                files: encryptedFiles,
                password: state.enablePassword ? state.formData.password : '',
                preventBurn: state.formData.preventBurn,
                isPublic: state.isPublic,
            };

            const { id, message } = await createSecret(payload);

            if (message && !id) {
                set({
                    errors: {
                        banner: {
                            title: t('error'),
                            message: t(message) || message,
                            dismissible: true,
                        },
                        fields: {},
                        sections: {},
                    },
                });
                return;
            }

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
    onEnablePassword: () =>
        set((state) => {
            const newEnablePassword = !state.enablePassword;
            const newPassword = newEnablePassword
                ? generate({
                      length: 12,
                      numbers: true,
                      symbols: true,
                      uppercase: true,
                      lowercase: true,
                  })
                : '';

            return {
                enablePassword: newEnablePassword,
                formData: {
                    ...state.formData,
                    password: newPassword,
                },
            };
        }),
}));

export default useSecretStore;
