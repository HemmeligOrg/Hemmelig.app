import { Buffer } from 'buffer/';
import { nanoid } from 'nanoid';
import tweetnacl from 'tweetnacl';
import tweetnaclUtil from 'tweetnacl-util';

const { secretbox, randomBytes } = tweetnacl;
const { decodeUTF8, encodeUTF8 } = tweetnaclUtil;

export const generateKey = (password = '') => {
    if (password) {
        return nanoid(32 - password.length);
    }

    return nanoid(32);
};

const newNonce = () => randomBytes(secretbox.nonceLength);

export const encrypt = (data, userEncryptionKey) => {
    const keyUint8Array = decodeUTF8(userEncryptionKey);

    const nonce = newNonce();
    const messageUint8 = decodeUTF8(data);

    const box = secretbox(messageUint8, nonce, keyUint8Array);

    const fullMessage = new Uint8Array(nonce.length + box.length);
    fullMessage.set(nonce);
    fullMessage.set(box, nonce.length);

    return Buffer.from(fullMessage).toString('hex');
};

export const decrypt = (messageWithNonceHex, userEncryptionKey) => {
    const keyUint8Array = decodeUTF8(userEncryptionKey);

    const messageWithNonceAsUint8Array = Uint8Array.from(Buffer.from(messageWithNonceHex, 'hex'));
    const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength);
    const message = messageWithNonceAsUint8Array.slice(
        secretbox.nonceLength,
        messageWithNonceAsUint8Array.length
    );

    const decrypted = secretbox.open(message, nonce, keyUint8Array);

    if (!decrypted) {
        throw new Error('Could not decrypt message');
    }

    return encodeUTF8(decrypted);
};
