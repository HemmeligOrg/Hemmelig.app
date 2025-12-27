import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRaw } from '../lib/api';
import { authClient } from '../lib/auth';

type SocialProvider =
    | 'github'
    | 'google'
    | 'microsoft'
    | 'discord'
    | 'gitlab'
    | 'apple'
    | 'twitter'
    | string; // Allow any string for generic OAuth providers

interface SocialLoginButtonsProps {
    mode: 'login' | 'register';
}

// SVG Icons for each provider
const GithubIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

const MicrosoftIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M11.4 24H0V12.6h11.4V24z" fill="#00A4EF" />
        <path d="M24 24H12.6V12.6H24V24z" fill="#FFB900" />
        <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022" />
        <path d="M24 11.4H12.6V0H24v11.4z" fill="#7FBA00" />
    </svg>
);

const DiscordIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
);

const GitLabIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
            d="m23.6 9.593-.033-.086L20.3.98a.851.851 0 0 0-.336-.405.869.869 0 0 0-.99.07.857.857 0 0 0-.283.39l-2.2 6.74H7.51l-2.2-6.74a.86.86 0 0 0-.283-.39.868.868 0 0 0-.99-.07.851.851 0 0 0-.336.405L.433 9.502l-.032.086a6.066 6.066 0 0 0 2.012 7.01l.01.008.028.02 4.98 3.727 2.462 1.863 1.5 1.134a1.011 1.011 0 0 0 1.22 0l1.5-1.134 2.462-1.863 5.008-3.747.012-.01a6.068 6.068 0 0 0 2.006-7.003z"
            fill="#E24329"
        />
    </svg>
);

const AppleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
);

const TwitterIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

// Generic OAuth icon for unknown providers (shield with checkmark)
const GenericOAuthIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.5 12.81l-2.8-2.8 1.4-1.42 1.4 1.42 4.24-4.24 1.41 1.41-5.65 5.63z" />
    </svg>
);

// Provider display configuration
const providerConfig: Record<
    SocialProvider,
    { name: string; icon: React.ReactNode; buttonClass: string }
> = {
    github: {
        name: 'GitHub',
        icon: <GithubIcon />,
        buttonClass:
            'bg-gray-900 hover:bg-black text-white dark:bg-gray-800 dark:hover:bg-gray-700',
    },
    google: {
        name: 'Google',
        icon: <GoogleIcon />,
        buttonClass: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 dark:border-gray-600',
    },
    microsoft: {
        name: 'Microsoft',
        icon: <MicrosoftIcon />,
        buttonClass: 'bg-white hover:bg-gray-50 text-gray-900 dark:bg-gray-100 dark:hover:bg-white',
    },
    discord: {
        name: 'Discord',
        icon: <DiscordIcon />,
        buttonClass: 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
    },
    gitlab: {
        name: 'GitLab',
        icon: <GitLabIcon />,
        buttonClass: 'bg-[#FC6D26] hover:bg-[#E24329] text-white',
    },
    apple: {
        name: 'Apple',
        icon: <AppleIcon />,
        buttonClass: 'bg-black hover:bg-gray-900 text-white',
    },
    twitter: {
        name: 'X',
        icon: <TwitterIcon />,
        buttonClass: 'bg-black hover:bg-gray-900 text-white',
    },
};

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
                    provider: provider as any,
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
            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-dark-500/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-dark-800/80 text-gray-500 dark:text-slate-400">
                        {t('login_page.or_continue_with')}
                    </span>
                </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
                {providers.map((provider) => {
                    const config = providerConfig[provider as keyof typeof providerConfig];

                    // If config exists, it's a known provider
                    if (config) {
                        const buttonText =
                            mode === 'login'
                                ? t('social_login.continue_with', { provider: config.name })
                                : t('social_login.sign_up_with', { provider: config.name });

                        return (
                            <button
                                key={provider}
                                onClick={() => handleSocialLogin(provider)}
                                className={`w-full flex items-center justify-center space-x-3 py-2.5 px-4 border font-medium transition-all duration-300 hover:scale-105 cursor-pointer ${config.buttonClass}`}
                            >
                                {config.icon}
                                <span>{buttonText}</span>
                            </button>
                        );
                    }

                    // Generic OAuth provider (unknown provider)
                    // Capitalize first letter for display name
                    const displayName = provider.charAt(0).toUpperCase() + provider.slice(1);
                    const buttonText =
                        mode === 'login'
                            ? t('social_login.continue_with', { provider: displayName })
                            : t('social_login.sign_up_with', { provider: displayName });

                    return (
                        <button
                            key={provider}
                            onClick={() => handleSocialLogin(provider)}
                            className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 border font-medium transition-all duration-300 hover:scale-105 cursor-pointer bg-light-700 hover:bg-light-600 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-900 dark:text-white border-gray-300 dark:border-dark-500"
                        >
                            <GenericOAuthIcon />
                            <span>{buttonText}</span>
                        </button>
                    );
                })}
            </div>
        </>
    );
}
