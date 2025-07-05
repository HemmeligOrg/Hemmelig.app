import { Buffer } from 'buffer/';
import { nanoid } from 'nanoid';
import tweetnacl from 'tweetnacl';
import tweetnaclUtil from 'tweetnacl-util';
import { md5 } from "js-md5"

const { secretbox, randomBytes } = tweetnacl;
const { decodeUTF8, encodeUTF8 } = tweetnaclUtil; // No longer need Base64 utils

export const generateEncryptionKey = (password: string) => {
    if (password) {
        const hash = md5.create();
        return hash.update(password).hex();
    }

    return nanoid(32);
};

const newNonce = () => randomBytes(secretbox.nonceLength);

/**
 * Encrypts data and returns a Uint8Array ready for BLOB storage.
 * @param {string} text - The string data to encrypt.
 * @param {string} userEncryptionKey - The 32-byte encryption key.
 * @returns {Uint8Array} - The combined nonce and encrypted box, ready to be saved.
 */
export const encrypt = (text, userEncryptionKey) => {
    const keyUint8Array = new Uint8Array(Buffer.from(userEncryptionKey));
    const nonce = newNonce();
    const messageUint8 = decodeUTF8(text); // Assuming jsonData is a JSON string

    const box = secretbox(messageUint8, nonce, keyUint8Array);

    const fullMessage = new Uint8Array(nonce.length + box.length);
    fullMessage.set(nonce);
    fullMessage.set(box, nonce.length);

    // RETURN the raw Uint8Array instead of a Base64 string
    return fullMessage;
};

export const encryptFile = (fileBuffer: ArrayBuffer, userEncryptionKey: string) => {
    const keyUint8Array = new Uint8Array(Buffer.from(userEncryptionKey));
    const nonce = newNonce();
    const messageUint8 = new Uint8Array(fileBuffer);

    const box = secretbox(messageUint8, nonce, keyUint8Array);

    const fullMessage = new Uint8Array(nonce.length + box.length);
    fullMessage.set(nonce);
    fullMessage.set(box, nonce.length);

    return fullMessage;
};

/**
 * Decrypts a Uint8Array or Buffer from a BLOB field.
 * @param {Uint8Array | Buffer} fullMessage - The raw encrypted data from the database.
 * @param {string} userEncryptionKey - The 32-byte encryption key.
 * @returns {string} - The decrypted string data.
 */
export const decrypt = (fullMessage, userEncryptionKey) => {
    // The input is already a Uint8Array/Buffer, so no need to decode from Base64.
    const keyUint8Array = new Uint8Array(Buffer.from(userEncryptionKey));

    const nonce = fullMessage.slice(0, secretbox.nonceLength);
    const message = fullMessage.slice(secretbox.nonceLength);

    const decrypted = secretbox.open(message, nonce, keyUint8Array);

    if (!decrypted) {
        throw new Error('Could not decrypt message');
    }

    return encodeUTF8(decrypted);
};

export const decryptFile = (fullMessage: Uint8Array, userEncryptionKey: string): Uint8Array => {
    const keyUint8Array = new Uint8Array(Buffer.from(userEncryptionKey));
    const nonce = fullMessage.slice(0, secretbox.nonceLength);
    const message = fullMessage.slice(secretbox.nonceLength);

    const decrypted = secretbox.open(message, nonce, keyUint8Array);

    if (!decrypted) {
        throw new Error('Could not decrypt message');
    }

    return decrypted;
};
