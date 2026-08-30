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

test('Czech locale has exact key parity with English', async () => {
    const [english, czech] = await Promise.all([readLocale('en'), readLocale('cs')]);

    assert.deepEqual(scalarPaths(czech).sort(), scalarPaths(english).sort());
});

test('Czech locale preserves every runtime placeholder', async () => {
    const [english, czech] = await Promise.all([readLocale('en'), readLocale('cs')]);
    const czechByPath = new Map(scalarEntries(czech));

    for (const [path, source] of scalarEntries(english)) {
        assert.deepEqual(placeholders(czechByPath.get(path)), placeholders(source), path);
    }
});
