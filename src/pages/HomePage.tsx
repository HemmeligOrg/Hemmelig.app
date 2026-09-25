import { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SecretForm } from '../components/SecretForm';
import { SecretSettings } from '../components/SecretSettings';
import { useHemmeligStore } from '../store/hemmeligStore';
import { useSecretStore } from '../store/secretStore';
import { useUserStore } from '../store/userStore';

function Features() {
    const { t } = useTranslation();

    const features = [
        {
            title: t('home_page.features.encrypted_title'),
            body: t('home_page.features.encrypted_body'),
        },
        {
            title: t('home_page.features.fragment_title'),
            body: (
                <Trans
                    i18nKey="home_page.features.fragment_body"
                    components={{ mono: <span className="font-mono" /> }}
                />
            ),
            highlight: true,
        },
        { title: t('home_page.features.gone_title'), body: t('home_page.features.gone_body') },
    ];

    return (
        <section className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
            {features.map((feature, index) => (
                <div
                    key={index}
                    className={`grid gap-1 content-start pt-3.5 border-t ${
                        feature.highlight ? 'border-accent' : 'border-line-strong'
                    }`}
                >
                    <div
                        className={`font-mono text-ui ${feature.highlight ? 'text-accent' : 'text-fg'}`}
                    >
                        {String(index + 1).padStart(2, '0')} · {feature.title}
                    </div>
                    <div className="text-sm text-muted text-pretty">{feature.body}</div>
                </div>
            ))}
        </section>
    );
}

export function HomePage() {
    const { t } = useTranslation();
    const { secretId } = useSecretStore();
    const { settings } = useHemmeligStore();
    const user = useUserStore((s) => s.user);
    const navigate = useNavigate();

    useEffect(() => {
        if (settings.requireRegisteredUser && !user) {
            navigate('/login', { replace: true, state: { requireAccount: true } });
        }
    }, [settings.requireRegisteredUser, user, navigate]);

    if (secretId) {
        return <SecretSettings />;
    }

    return (
        <main className="max-w-content mx-auto px-6 pt-12 grid gap-4">
            <div className="grid gap-2.5 mb-3">
                <div className="font-mono text-ui text-accent">{t('home_page.kicker')}</div>
                <h1 className="m-0 text-[clamp(28px,4.4vw,40px)] leading-[1.1] tracking-[-0.03em] font-medium text-balance">
                    {t('home_page.title')}
                </h1>
                <p className="m-0 max-w-150 text-fg-3 text-pretty">
                    {settings.instanceDescription || t('home_page.subtitle')}
                </p>
            </div>

            <SecretForm />

            <Features />
        </main>
    );
}
