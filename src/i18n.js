import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

//fallback defined by ENV disabled because config cant be imported
//import config from '/config/default';
//const [defaultLanguage] = useState(config.get('settings.defaultLanguage'))

i18next
    .use(initReactI18next)
    .use(HttpApi)
    .use(LanguageDetector)
    .init({
        //Language with autodetection
        fallbackLng: 'en', //{defaultLanguage}
        detection: {
            order: ['path', 'navigator'],
        },

        interpolation: {
            escapeValue: false,
        },
        debug: process.env.NODE_ENV === 'development',
    });
export default i18next;
