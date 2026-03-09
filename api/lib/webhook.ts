import { createHmac } from 'crypto';
import { resolveSettings } from './settings';

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
 * Sends an HTTP POST with exponential backoff retry.
 * Shared by both the main webhook system and secret-request webhooks.
 */
export async function sendWithRetry(
    url: string,
    headers: Record<string, string>,
    body: string,
    maxRetries = 3
): Promise<void> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body,
                signal: AbortSignal.timeout(5000),
                redirect: 'error',
            });

            if (response.ok) return;

            if (response.status >= 400 && response.status < 500) {
                console.error(`Webhook delivery failed: ${response.status}`);
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
