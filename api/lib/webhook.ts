import { createHmac } from 'crypto';
import prisma from './db';
import instanceSettings from '../instance-settings';

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

export async function sendWebhook(event: WebhookEvent, data: WebhookPayload['data']): Promise<void> {
    try {
        let settings = instanceSettings.get('instanceSettings');
        if (!settings) {
            settings = await prisma.instanceSettings.findFirst();
            if (settings) {
                instanceSettings.set('instanceSettings', settings);
            }
        }

        if (!settings?.webhookEnabled || !settings.webhookUrl) {
            return;
        }

        // Check if this event type should trigger webhook
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
        };

        // Add HMAC signature if secret is configured
        if (settings.webhookSecret) {
            const signature = signPayload(payloadString, settings.webhookSecret);
            headers['X-Hemmelig-Signature'] = `sha256=${signature}`;
        }

        // Fire and forget - don't block the response
        fetch(settings.webhookUrl, {
            method: 'POST',
            headers,
            body: payloadString,
        }).catch((error) => {
            console.error('Failed to send webhook:', error);
        });
    } catch (error) {
        console.error('Error preparing webhook:', error);
    }
}
