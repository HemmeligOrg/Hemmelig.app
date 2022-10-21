#!/usr/bin/env node

import meow from 'meow';
import fetch from 'node-fetch';
import { generateKey, encrypt } from './src/shared/helpers/crypto.js';

const cli = meow(
    `
	Usage
	  $ hemmelig <secret>

	Options
      --title,     -t  The secret title
      --password,  -p  The password to protect the secret
      --lifetime,  -l  The lifetime of the secret
      --maxViews,  -m  The max views of the secret
      --cidr,      -c  Provide the IP or CIDR range
      --expire,    -e  Burn the secret only after the expire time
      --url,       -u  If you have your own instance of the Hemmelig.app

	Examples
	  $ hemmelig "my super secret" --password=1337
	  [*] Hemmelig.app URL: https://hemmelig.app/secret/myencryptionkey/thesecretid

      # Pipe data to the hemmelig cli
      $ cat mysecret.txt | hemmelig
      [*] Hemmelig.app URL: https://hemmelig.app/secret/myencryptionkey2/thesecretid2
`,
    {
        importMeta: import.meta,
        flags: {
            title: {
                type: 'string',
                alias: 't',
                default: '',
            },
            password: {
                type: 'string',
                alias: 'p',
                default: '',
            },
            lifetime: {
                type: 'number',
                alias: 'l',
                default: 3600,
            },
            maxViews: {
                type: 'number',
                alias: 'm',
                default: 1,
            },
            cidr: {
                type: 'string',
                alias: 'c',
                default: '',
            },
            expire: {
                type: 'boolean',
                alias: 'e',
                default: false,
            },
            url: {
                type: 'string',
                alias: 'u',
                default: 'https://hemmelig.app',
            },
        },
    }
);

const createSecret = async (data = {}) => {
    const options = {
        method: 'POST',
        cache: 'no-cache',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        const data = await fetch(`${cli.flags.url}/api/secret`, options);
        const json = await data.json();

        return { ...json, statusCode: data.status };
    } catch (error) {
        console.error(error);

        return { error: 'Failed to create your secret' };
    }
};

const getSecretURL = (encryptionKey, secretId) =>
    `${cli.flags.url}/secret/${encryptionKey}/${secretId}`;

const submit = async (secret, values) => {
    if (!secret) {
        console.error('No secret set');
        return;
    }

    const userEncryptionKey = generateKey();

    const body = {
        text: encrypt(secret, userEncryptionKey),
        files: [],
        title: encrypt(values.title, userEncryptionKey),
        password: values.password,
        ttl: values.lifetime,
        allowedIp: values.cidr,
        preventBurn: values.expire,
        maxViews: values.maxViews,
    };

    const json = await createSecret(body);

    console.log(`[*] Hemmelig.app URL: ${getSecretURL(userEncryptionKey, json.id)}`);
};

async function getSecretText() {
    const [secret] = cli.input;

    if (secret) {
        return secret;
    }

    const data = await new Promise((res) => {
        process.stdin.once('data', function (data) {
            res(data.toString().trim());
        });
    });

    return data;
}

// Execute the CLI
(async function execute() {
    const secret = await getSecretText();

    submit(secret, cli.flags);
})();
