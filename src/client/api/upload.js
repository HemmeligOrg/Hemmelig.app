import config from '../config';

export const downloadFile = async (fileData, token) => {
    const { key, encryptionKey, ext, mime, secretId } = fileData;

    const data = await fetch(`${config.get('api.host')}/upload/download`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key, encryptionKey, ext, mime, secretId }),
    });

    if (data.status === 401) {
        return {
            statusCode: 401,
        };
    }

    const blob = await data.blob();
    const imageUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${secretId}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
