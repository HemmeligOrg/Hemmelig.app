import JSZip from 'jszip';
import tweetnaclUtil from 'tweetnacl-util';
const { encodeBase64 } = tweetnaclUtil;

async function getFileContent(file) {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = (e) => {
            resolve(e.target.result);
        };

        reader.onerror = () => {
            reject(`Error occurred reading file: ${file.name}`);
        };

        reader.readAsBinaryString(file);
    });
}

export async function zipFiles(files) {
    if (!files?.length) {
        return '';
    }

    const zip = new JSZip();
    const folder = zip.folder('hemmelig_files');

    for (const file of files) {
        const content = await getFileContent(file);

        folder.file(file.name, content, { binary: true });
    }

    const data = await zip.generateAsync({ type: 'uint8array' });

    return encodeBase64(data);
}
