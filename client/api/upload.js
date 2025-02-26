import { decrypt } from '../../shared/helpers/crypto';
import config from '../config';

export const downloadFile = async (fileData) => {
    const { file, secretId, decryptionKey } = fileData;

    const { key, ext, type } = file;

    const data = await fetch(`${config.get('api.host')}/download/`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, secretId }),
    });

    const json = await data.json();

    if (data.status === 401) {
        return {
            statusCode: 401,
        };
    }

    const fileContent = new Uint8Array(Buffer.from(decrypt(json.content, decryptionKey), 'hex'));

    const a = document.createElement('a');
    const blob = new Blob([fileContent], { type });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = 'hemmelig_files' + ext;
    a.click();
    window.URL.revokeObjectURL(url);
};
