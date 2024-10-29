import { generate } from 'generate-password-browser';
import { create } from 'zustand';

const useSecretStore = create((set) => ({
    formData: {
        text: '',
        title: '',
        password: '',
        files: [],
        maxViews: 1,
        burnAfterReading: false,
        burnAfterTime: false,
    },
    ttl: 3600,
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
    title: '',
    setFormData: (update) =>
        set((state) => ({
            formData: { ...state.formData, ...update },
        })),
    setTTL: (ttl) => set({ ttl }),
    setTitle: (title) => set({ title }),
    setField: (field, value) => set((state) => ({ ...state, [field]: value })),
    setEnablePassword: (enablePassword) => set({ enablePassword }),
    setIsPublic: (isPublic) => set({ isPublic }),
    setCreatingSecret: (creatingSecret) => set({ creatingSecret }),
    setErrors: (errors) =>
        set((state) => ({
            errors: { ...state.errors, ...errors },
        })),
    setSecretId: (secretId) => set({ secretId }),
    setEncryptionKey: (encryptionKey) => set({ encryptionKey }),
    reset: () =>
        set({
            formData: {
                text: '',
                title: '',
                password: '',
                files: [],
                maxViews: 1,
                burnAfterReading: false,
                burnAfterTime: false,
            },
            ttl: 3600,
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
        }),
    removeFile: (index) =>
        set((state) => {
            const files = [...state.formData.files];
            files.splice(index, 1);
            return { formData: { ...state.formData, files } };
        }),
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
    onEnablePassword: () =>
        set((state) => ({
            enablePassword: !state.enablePassword,
            formData: {
                ...state.formData,
                password: !state.enablePassword
                    ? generate({
                          length: 12,
                          numbers: true,
                          symbols: true,
                          uppercase: true,
                          lowercase: true,
                      })
                    : '',
            },
        })),
}));

export default useSecretStore;
