import { createHmac } from 'crypto';
import { lookup as dnsLookup } from 'node:dns';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { LookupFunction } from 'node:net';
import { isIP as nodeIsIP } from 'node:net';
import { resolveSettings } from './settings';
import { isPublicIpAddress } from './utils';

export type WebhookEvent = 'secret.viewed' | 'secret.burned' | 'apikey.created';

interface SecretWebhookData {
    secretId: string;
    hasPassword: boolean;
    hasIpRestriction: boolean;
    viewsRemaining?: number;
}

interface ApiKeyWebhookData {
    apiKeyId: string;
    name: string;
    expiresAt: string | null;
    userId: string;
}

interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: SecretWebhookData | ApiKeyWebhookData;
}

function signPayload(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * DNS lookup that validates every resolved address at connection time and
 * passes the validated address to the socket. This closes the DNS rebinding
 * window between URL validation and delivery.
 */
const pinnedLookup: LookupFunction = (hostname, options, callback) => {
    dnsLookup(hostname, { all: true }, (error, addresses) => {
        if (error) {
            callback(error, '');
            return;
        }

        if (addresses.some((address) => !isPublicIpAddress(address.address))) {
            callback(new Error(`Webhook host resolves to a non-public address: ${hostname}`), '');
            return;
        }

        if (options.all) {
            callback(null, addresses);
            return;
        }

        const [first] = addresses;
        callback(null, first.address, first.family);
    });
};

/**
 * Sends a single POST request to a validated destination.
 * @returns The HTTP status code.
 */
const postOnce = (
    target: URL,
    headers: Record<string, string>,
    body: string,
    timeoutMs: number
): Promise<number> =>
    new Promise((resolve, reject) => {
        const hostname = target.hostname.replace(/^\[|\]$/g, '');

        // DNS lookups are skipped for IP literals, so validate them directly.
        if (nodeIsIP(hostname) && !isPublicIpAddress(hostname)) {
            reject(new Error(`Webhook host is not a public address: ${hostname}`));
            return;
        }

        const transport = target.protocol === 'https:' ? httpsRequest : httpRequest;
        const request = transport(
            target,
            {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Length': Buffer.byteLength(body).toString(),
                },
                lookup: pinnedLookup,
                signal: AbortSignal.timeout(timeoutMs),
            },
            (response) => {
                response.resume();
                resolve(response.statusCode ?? 0);
            }
        );

        request.on('error', reject);
        request.end(body);
    });

/**
 * Sends an HTTP POST with exponential backoff retry.
 * Shared by both the main webhook system and secret-request webhooks.
 */
export async function sendWithRetry(
    url: string,
    headers: Record<string, string>,
    body: string,
    maxRetries = 3
): Promise<void> {
    let target: URL;

    try {
        target = new URL(url);
    } catch {
        console.error('Webhook delivery failed: invalid URL');
        return;
    }

    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
        console.error('Webhook delivery failed: unsupported protocol');
        return;
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const status = await postOnce(target, headers, body, 5000);

            if (status >= 200 && status < 300) return;

            if (status >= 400 && status < 500) {
                console.error(`Webhook delivery failed: ${status}`);
                return;
            }
        } catch (error) {
            if (attempt === maxRetries - 1) {
                console.error('Webhook delivery failed after retries:', error);
                return;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
}

export function sendWebhook(event: WebhookEvent, data: WebhookPayload['data']): void {
    (async () => {
        try {
            const settings = await resolveSettings();

            if (!settings?.webhookEnabled || !settings.webhookUrl) {
                return;
            }

            if (event === 'secret.viewed' && !settings.webhookOnView) {
                return;
            }
            if (event === 'secret.burned' && !settings.webhookOnBurn) {
                return;
            }

            const payload: WebhookPayload = {
                event,
                timestamp: new Date().toISOString(),
                data,
            };

            const payloadString = JSON.stringify(payload);
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Hemmelig-Event': event,
                'User-Agent': 'Hemmelig-Webhook/1.0',
            };

            if (settings.webhookSecret) {
                const signature = signPayload(payloadString, settings.webhookSecret);
                headers['X-Hemmelig-Signature'] = `sha256=${signature}`;
            }

            await sendWithRetry(settings.webhookUrl, headers, payloadString);
        } catch (error) {
            console.error('Error preparing webhook:', error);
        }
    })();
}
