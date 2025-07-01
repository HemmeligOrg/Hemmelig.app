import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en/en.json';
import esTranslations from './locales/es/es.json';

i18n.use(initReactI18next).init({
    fallbackLng: 'en',
    lng: 'en', // default language
    detection: {
        order: ['navigator'],
    },
    debug: true,
    interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
        en: { translations: enTranslations },
        es: { translations: esTranslations },
    },
    defaultNS: 'translations',
});

export default i18n;
