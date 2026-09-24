import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRaw } from '../lib/api';
import { authClient } from '../lib/auth';
import { Button } from './Button';

interface SocialLoginButtonsProps {
    mode: 'login' | 'register';
}

// Display names for the known providers. Other providers are generic OAuth.
const providerNames: Record<string, string> = {
    github: 'GitHub',
    google: 'Google',
    microsoft: 'Microsoft',
    discord: 'Discord',
    gitlab: 'GitLab',
    apple: 'Apple',
    twitter: 'X',
};

type SocialSignInProvider = Parameters<typeof authClient.signIn.social>[0]['provider'];

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
    const { t } = useTranslation();
    const [providers, setProviders] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const res = await apiRaw.config['social-providers'].$get();
                if (res.ok) {
                    const data = await res.json();
                    setProviders(data.providers as string[]);
                }
            } catch (error) {
                console.error('Failed to fetch social providers:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProviders();
    }, []);

    const handleSocialLogin = async (provider: string) => {
        try {
            // Check if it's a known standard provider
            const standardProviders = [
                'github',
                'google',
                'microsoft',
                'discord',
                'gitlab',
                'apple',
                'twitter',
            ];

            if (standardProviders.includes(provider)) {
                // Use standard social sign-in
                await authClient.signIn.social({
                    provider: provider as SocialSignInProvider,
                    callbackURL: '/dashboard',
                });
            } else {
                // Use OAuth2 sign-in for generic providers
                const response = await fetch('/api/auth/sign-in/oauth2', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        providerId: provider,
                        callbackURL: window.location.origin + '/dashboard',
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.url) {
                        window.location.href = data.url;
                    }
                } else {
                    console.error(`OAuth2 login failed for ${provider}`);
                }
            }
        } catch (error) {
            console.error(`${provider} login failed:`, error);
        }
    };

    if (isLoading || providers.length === 0) {
        return null;
    }

    return (
        <>
            <div className="flex items-center gap-3 text-xs text-faint">
                <span className="flex-1 h-px bg-line-soft" />
                {t('login_page.or')}
                <span className="flex-1 h-px bg-line-soft" />
            </div>

            {providers.map((provider) => {
                // Capitalize the first letter of a generic OAuth provider id.
                const displayName =
                    providerNames[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
                const buttonText =
                    mode === 'login'
                        ? t('social_login.continue_with', { provider: displayName })
                        : t('social_login.sign_up_with', { provider: displayName });

                return (
                    <Button
                        key={provider}
                        variant="secondary"
                        size="lg"
                        className="w-full text-fg"
                        onClick={() => handleSocialLogin(provider)}
                    >
                        {buttonText}
                    </Button>
                );
            })}
        </>
    );
}
