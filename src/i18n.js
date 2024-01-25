import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import config from './client/config';

function getLanguage() {
    const language = config.get('settings.forcedLanguage');
    const detectionMethod = ['navigator'];

    return { language, detectionMethod };
}

const { language, detectionMethod } = getLanguage();

i18next
    .use(initReactI18next)
    .use(HttpApi)
    .use(LanguageDetector)
    .init({
        fallbackLng: language,
        detection: {
            order: detectionMethod,
        },
        interpolation: {
            escapeValue: false,
        },
        debug: process.env.NODE_ENV === 'development',
    });
export default i18next;
