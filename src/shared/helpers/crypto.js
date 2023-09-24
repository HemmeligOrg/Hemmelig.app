import { nanoid } from 'nanoid';
import tweetnacl from 'tweetnacl';
import tweetnaclUtil from 'tweetnacl-util';
import { Buffer } from 'buffer/';

const { secretbox, randomBytes } = tweetnacl;
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } = tweetnaclUtil;

export const generateKey = (password = '') => {
    if (password) {
        return nanoid(32 - password.length);
    }

    return nanoid(32);
};

const newNonce = () => randomBytes(secretbox.nonceLength);

export const encrypt = (data, userEncryptionKey) => {
    const keyUint8Array = new Uint8Array(Buffer.from(userEncryptionKey));

    const nonce = newNonce();
    const messageUint8 = decodeUTF8(data);

    const box = secretbox(messageUint8, nonce, keyUint8Array);

    const fullMessage = new Uint8Array(nonce.length + box.length);
    fullMessage.set(nonce);
    fullMessage.set(box, nonce.length);

    const base64FullMessage = encodeBase64(fullMessage);

    return base64FullMessage;
};

export const decrypt = (messageWithNonce, userEncryptionKey) => {
    const keyUint8Array = new Uint8Array(Buffer.from(userEncryptionKey));

    const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
    const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength);
    const message = messageWithNonceAsUint8Array.slice(
        secretbox.nonceLength,
        messageWithNonce.length
    );

    const decrypted = secretbox.open(message, nonce, keyUint8Array);

    if (!decrypted) {
        throw new Error('Could not decrypt message');
    }

    const base64DecryptedMessage = encodeUTF8(decrypted);

    return base64DecryptedMessage;
};
