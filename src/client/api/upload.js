import config from '../config';

export const downloadFile = async (fileData) => {
    const { key, encryptionKey, extension, mimetype, secretId } = fileData;

    const data = await fetch(`${config.get('api.host')}/upload/get_image`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, encryptionKey, extension, mimetype }),
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
    link.download = `${secretId}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
