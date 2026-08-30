import i18next from 'i18next';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readLocale = async (locale) =>
    JSON.parse(
        await readFile(new URL(`../src/i18n/locales/${locale}/${locale}.json`, import.meta.url))
    );

const scalarPaths = (value, prefix = '') =>
    Object.entries(value).flatMap(([key, child]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return child !== null && typeof child === 'object' ? scalarPaths(child, path) : [path];
    });

const scalarEntries = (value, prefix = '') =>
    Object.entries(value).flatMap(([key, child]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return child !== null && typeof child === 'object'
            ? scalarEntries(child, path)
            : [[path, String(child)]];
    });

const placeholders = (text) => [...text.matchAll(/\{\{[^{}]+\}\}/g)].map(([value]) => value).sort();

test('Czech locale translates the login action', async () => {
    const czech = await readLocale('cs');

    assert.equal(czech.login_page.sign_in_button, 'Přihlásit se');
});

test('Czech locale keeps Secret and Dashboard as product terms', async () => {
    const czech = await readLocale('cs');

    assert.equal(czech.header.dashboard, 'Dashboard');
    assert.equal(czech.dashboard_layout.secrets, 'Secrets');
    assert.equal(czech.secrets_page.table.secret_header, 'Secret');
    assert.equal(czech.secret_settings.create_new_secret_button, 'Vytvořit nový secret');

    const dictionaryMeaning = czech.footer.tagline;
    const productCopy = scalarEntries(czech)
        .filter(([path]) => path !== 'footer.tagline')
        .map(([, value]) => value)
        .join('\n');

    assert.match(dictionaryMeaning, /tajemství/u);
    assert.doesNotMatch(productCopy, /tajemstv|tajemn/u);
});

test('Czech locale renders one, few, and other time plurals', async () => {
    const [english, czech] = await Promise.all([readLocale('en'), readLocale('cs')]);
    const i18n = i18next.createInstance();

    await i18n.init({
        lng: 'cs',
        fallbackLng: 'en',
        resources: {
            cs: { translation: czech },
            en: { translation: english },
        },
    });

    for (const [unit, cases] of Object.entries({
        days: ['1 den', '2 dny', '4 dny', '5 dní'],
        hours: ['1 hodina', '2 hodiny', '4 hodiny', '5 hodin'],
        minutes: ['1 minuta', '2 minuty', '4 minuty', '5 minut'],
    })) {
        for (const [index, count] of [1, 2, 4, 5].entries()) {
            assert.equal(i18n.t(`secret_requests_page.time.${unit}`, { count }), cases[index]);
        }
    }
});

test('Czech locale contains every English key and only Czech plural extensions', async () => {
    const [english, czech] = await Promise.all([readLocale('en'), readLocale('cs')]);
    const englishPaths = scalarPaths(english).sort();
    const czechPaths = scalarPaths(czech).sort();
    const czechPluralExtensions = [
        'secret_requests_page.time.days_few',
        'secret_requests_page.time.hours_few',
        'secret_requests_page.time.minutes_few',
    ];

    assert.deepEqual(
        czechPaths.filter((path) => !czechPluralExtensions.includes(path)),
        englishPaths
    );
    assert.deepEqual(
        czechPaths.filter((path) => !englishPaths.includes(path)),
        czechPluralExtensions
    );
});

test('Czech locale preserves every runtime placeholder', async () => {
    const [english, czech] = await Promise.all([readLocale('en'), readLocale('cs')]);
    const czechByPath = new Map(scalarEntries(czech));

    for (const [path, source] of scalarEntries(english)) {
        assert.deepEqual(placeholders(czechByPath.get(path)), placeholders(source), path);
    }
});
