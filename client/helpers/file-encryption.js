import tweetnaclUtil from 'tweetnacl-util';
import { encrypt } from '../../shared/helpers/crypto';

const { encodeBase64 } = tweetnaclUtil;

export function fileEncryption(file, encryptionKey) {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = (e) => {
            const data = encodeBase64(new Uint8Array(e.target.result));

            resolve({
                type: file.type,
                ext: file.name.match(/\.[0-9a-z]+$/i)[0],
                content: encrypt(data, encryptionKey),
            });
        };

        reader.onerror = () => {
            reject(`Error occurred reading file: ${file.name}`);
        };

        reader.readAsArrayBuffer(file);
    });
}
