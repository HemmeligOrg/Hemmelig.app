import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRaw } from '../lib/api';
import { authClient } from '../lib/auth';
import { Button } from './Button';

interface SocialProvider {
    id: string;
    generic: boolean;
    /** Name in the button text, set by the admin for a generic provider. */
    displayName?: string;
    /** Full button text, set by the admin for a generic provider. */
    label?: string;
    /** Base64 data URI of the button icon. */
    icon?: string;
}

export interface SocialProvidersConfig {
    providers: SocialProvider[];
    /** UI option: hide the username and password form on the login page. */
    hidePasswordLogin: boolean;
}

interface SocialProvidersResponse {
    providers?: string[];
    providerDetails?: SocialProvider[];
    hidePasswordLogin?: boolean;
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

/**
 * Loads the enabled social providers and the login page options.
 * The value is null while the request runs. Pass `enabled = false` to skip the request.
 */
export function useSocialProviders(enabled = true): SocialProvidersConfig | null {
    const [config, setConfig] = useState<SocialProvidersConfig | null>(null);

    useEffect(() => {
        if (!enabled) return;
        let active = true;

        const fetchProviders = async () => {
            // A failed request shows no social buttons and keeps the password form.
            let next: SocialProvidersConfig = { providers: [], hidePasswordLogin: false };
            try {
                const res = await apiRaw.config['social-providers'].$get();
                if (res.ok) {
                    const data = (await res.json()) as SocialProvidersResponse;
                    // Older servers send only the provider ids.
                    const providers =
                        data.providerDetails ??
                        (data.providers ?? []).map((id) => ({
                            id,
                            generic: !(id in providerNames),
                        }));
                    next = { providers, hidePasswordLogin: data.hidePasswordLogin === true };
                }
            } catch (error) {
                console.error('Failed to fetch social providers:', error);
            }
            if (active) setConfig(next);
        };

        fetchProviders();

        return () => {
            active = false;
        };
    }, [enabled]);

    return config;
}

interface SocialLoginButtonsProps {
    mode: 'login' | 'register';
    /** Provider config that the page already loaded. Without it, the component loads it. */
    config?: SocialProvidersConfig | null;
    /** Shows the "or" divider above the buttons. */
    showDivider?: boolean;
}

export function SocialLoginButtons({ mode, config, showDivider = true }: SocialLoginButtonsProps) {
    const { t } = useTranslation();
    const ownConfig = useSocialProviders(config === undefined);
    const providers = (config === undefined ? ownConfig : config)?.providers ?? [];

    const handleSocialLogin = async (provider: SocialProvider) => {
        try {
            if (!provider.generic) {
                await authClient.signIn.social({
                    provider: provider.id as SocialSignInProvider,
                    callbackURL: '/dashboard',
                });
                return;
            }

            // Generic providers use the OAuth2 sign-in of the generic OAuth plugin.
            const response = await fetch('/api/auth/sign-in/oauth2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    providerId: provider.id,
                    callbackURL: window.location.origin + '/dashboard',
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.url) {
                    window.location.assign(data.url);
                }
            } else {
                console.error(`OAuth2 login failed for ${provider.id}`);
            }
        } catch (error) {
            console.error(`${provider.id} login failed:`, error);
        }
    };

    if (providers.length === 0) {
        return null;
    }

    return (
        <>
            {showDivider && (
                <div className="flex items-center gap-3 text-xs text-faint">
                    <span className="flex-1 h-px bg-line-soft" />
                    {t('login_page.or')}
                    <span className="flex-1 h-px bg-line-soft" />
                </div>
            )}

            {providers.map((provider) => {
                // Capitalize the first letter of a generic OAuth provider id.
                const displayName =
                    provider.displayName ??
                    providerNames[provider.id] ??
                    provider.id.charAt(0).toUpperCase() + provider.id.slice(1);
                const buttonText =
                    provider.label ??
                    (mode === 'login'
                        ? t('social_login.continue_with', { provider: displayName })
                        : t('social_login.sign_up_with', { provider: displayName }));

                return (
                    <Button
                        key={provider.id}
                        variant="secondary"
                        size="lg"
                        className="w-full text-fg"
                        onClick={() => handleSocialLogin(provider)}
                    >
                        {provider.icon && (
                            <img
                                src={provider.icon}
                                alt=""
                                aria-hidden="true"
                                className="w-4 h-4 object-contain flex-none"
                            />
                        )}
                        {buttonText}
                    </Button>
                );
            })}
        </>
    );
}
