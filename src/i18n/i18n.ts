import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import daTranslations from './locales/da/da.json';
import deTranslations from './locales/de/de.json';
import enTranslations from './locales/en/en.json';
import esTranslations from './locales/es/es.json';
import frTranslations from './locales/fr/fr.json';
import itTranslations from './locales/it/it.json';
import nlTranslations from './locales/nl/nl.json';
import noTranslations from './locales/no/no.json';
import svTranslations from './locales/sv/sv.json';
import zhTranslations from './locales/zh/zh.json';

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: true,
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'hemmelig-language',
        },
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        resources: {
            en: { translations: enTranslations },
            es: { translations: esTranslations },
            de: { translations: deTranslations },
            fr: { translations: frTranslations },
            it: { translations: itTranslations },
            zh: { translations: zhTranslations },
            nl: { translations: nlTranslations },
            da: { translations: daTranslations },
            no: { translations: noTranslations },
            sv: { translations: svTranslations },
        },
        defaultNS: 'translations',
    });

export default i18n;
