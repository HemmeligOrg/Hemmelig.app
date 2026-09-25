// Creates and checks crypto test vectors with the web app code in src/lib/crypto.ts.
//
// Create vectors for the Go tests (run from the repository root):
//   npx tsx cli-go/testdata/crypto-vectors.mts generate > cli-go/testdata/vectors.json
//
// Check that the web code decrypts vectors that the Go code made:
//   npx tsx cli-go/testdata/crypto-vectors.mts verify cli-go/testdata/go-vectors.json
import { readFileSync } from 'node:fs';

// The web code reads the Web Crypto API from `window`.
(globalThis as { window?: typeof globalThis }).window = globalThis;

const crypto = await import('../../src/lib/crypto.ts');

interface TextVector {
    key: string;
    salt: string;
    plaintext: string;
    ciphertextHex: string;
}

interface FileVector {
    key: string;
    salt: string;
    plaintextHex: string;
    ciphertextHex: string;
}

interface VerifierVector {
    password: string;
    salt: string;
    verifier: string;
}

interface Vectors {
    text: TextVector[];
    files: FileVector[];
    verifiers: VerifierVector[];
}

const toHex = (bytes: Uint8Array) => crypto.bytesToHex(bytes);

const fromHex = (value: string): Uint8Array => {
    const bytes = crypto.hexToBytes(value);
    if (!bytes) {
        throw new Error(`Invalid hex: ${value.slice(0, 20)}`);
    }
    return bytes;
};

async function generate(): Promise<Vectors> {
    const key = crypto.generateEncryptionKey();
    const salt = crypto.generateSalt();
    const texts = ['Hello, Hemmelig!', '', 'Unicode: æøå ÆØÅ 秘密 🔐', '<p>line one</p><p>line two</p>'];
    const text: TextVector[] = [];
    for (const plaintext of texts) {
        text.push({ key, salt, plaintext, ciphertextHex: toHex(await crypto.encrypt(plaintext, key, salt)) });
    }

    // A password is also a valid key: the web app uses it as the key.
    const password = 'correct horse battery staple';
    text.push({
        key: password,
        salt,
        plaintext: 'password protected',
        ciphertextHex: toHex(await crypto.encrypt('password protected', password, salt)),
    });

    const fileBytes = new Uint8Array(256);
    for (let index = 0; index < fileBytes.length; index++) {
        fileBytes[index] = index;
    }
    const files: FileVector[] = [
        {
            key,
            salt,
            plaintextHex: toHex(fileBytes),
            ciphertextHex: toHex(await crypto.encryptFile(fileBytes.buffer, key, salt)),
        },
    ];

    const verifiers: VerifierVector[] = [
        { password, salt, verifier: await crypto.derivePasswordVerifier(password, salt) },
    ];

    return { text, files, verifiers };
}

async function verify(path: string): Promise<void> {
    const vectors = JSON.parse(readFileSync(path, 'utf8')) as Vectors;
    let checked = 0;

    for (const vector of vectors.text) {
        const plaintext = await crypto.decrypt(fromHex(vector.ciphertextHex), vector.key, vector.salt);
        if (plaintext !== vector.plaintext) {
            throw new Error(`Text mismatch: expected ${JSON.stringify(vector.plaintext)}`);
        }
        checked++;
    }

    for (const vector of vectors.files) {
        const plaintext = await crypto.decryptFile(fromHex(vector.ciphertextHex), vector.key, vector.salt);
        if (toHex(plaintext) !== vector.plaintextHex) {
            throw new Error('File mismatch');
        }
        checked++;
    }

    for (const vector of vectors.verifiers) {
        const verifier = await crypto.derivePasswordVerifier(vector.password, vector.salt);
        if (verifier !== vector.verifier) {
            throw new Error('Verifier mismatch');
        }
        checked++;
    }

    console.log(`ok: the web code accepted ${checked} vectors from the Go code`);
}

const [mode, path] = process.argv.slice(2);

if (mode === 'generate') {
    console.log(JSON.stringify(await generate(), null, 2));
} else if (mode === 'verify' && path) {
    await verify(path);
} else {
    console.error('Usage: crypto-vectors.mts generate | verify <file>');
    process.exit(2);
}
