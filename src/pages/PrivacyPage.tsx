import { useTranslation } from 'react-i18next';

export function PrivacyPage() {
    const { t } = useTranslation();

    return (
        <div className="px-6 pt-12 pb-4">
            <div className="max-w-reading mx-auto">
                <div className="grid gap-2.5 mb-10">
                    <div className="font-mono text-ui text-accent lowercase">
                        {'// '}
                        {t('footer.privacy')}
                    </div>
                    <h1 className="m-0 text-4xl font-medium tracking-tight text-fg">Privacy</h1>
                </div>

                <div className="grid gap-9 text-fg-3 leading-relaxed [&_strong]:font-medium [&_strong]:text-fg">
                    <section>
                        <h2 className="m-0 mb-2.5 text-lg font-medium tracking-tight text-fg">
                            Is my data secure?
                        </h2>
                        <p className="mb-4">
                            Yes, your data is secure. Hemmelig uses client-side encryption with{' '}
                            <strong>AES-256-GCM</strong>, a modern authenticated encryption
                            algorithm, powered by the Web Crypto API. All encryption and decryption
                            happens entirely in your browser. Your plaintext secret never leaves
                            your device.
                        </p>
                        <p className="mb-4">Here's how it works:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-4 marker:text-faint">
                            <li>
                                A unique 32-character encryption key is generated for each secret
                                (or you can provide your own password)
                            </li>
                            <li>
                                A unique 32-character salt is generated per secret and used with{' '}
                                <strong>PBKDF2</strong> (1,300,000 iterations, SHA-256) to derive a
                                256-bit AES key
                            </li>
                            <li>
                                A random 96-bit IV (initialization vector) is generated for each
                                encryption operation
                            </li>
                            <li>
                                The encrypted data (IV + ciphertext) is stored on the server — the
                                decryption key is only in the URL fragment (after the #) and is
                                never sent to the server
                            </li>
                        </ul>
                        <p>
                            This means even if our database were compromised, your secrets remain
                            encrypted and unreadable without the decryption key that only you
                            possess.
                        </p>
                    </section>

                    <section>
                        <h2 className="m-0 mb-2.5 text-lg font-medium tracking-tight text-fg">
                            Do you track me?
                        </h2>
                        <p className="mb-4">
                            We use privacy-focused analytics to understand how Hemmelig is being
                            used. Our analytics system is designed with privacy in mind:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-faint">
                            <li>
                                We use HMAC-SHA256 hashing to create anonymous visitor IDs — your
                                actual IP address is never stored
                            </li>
                            <li>We only track page visits (the path you visited)</li>
                            <li>Bot traffic is automatically filtered out</li>
                            <li>No personal information or secret content is ever tracked</li>
                            <li>
                                Analytics can be disabled entirely by the instance administrator
                            </li>
                        </ul>
                        <p className="mt-4">
                            This minimal tracking helps us improve the service while respecting your
                            privacy.
                        </p>
                    </section>

                    <section>
                        <h2 className="m-0 mb-2.5 text-lg font-medium tracking-tight text-fg">
                            I still don't trust this application.
                        </h2>
                        <p>
                            If that's the case, Hemmelig offers a Docker image so you can self-host
                            the application on your own infrastructure.
                        </p>
                    </section>

                    <section>
                        <h2 className="m-0 mb-2.5 text-lg font-medium tracking-tight text-fg">
                            What data is stored?
                        </h2>
                        <p className="mb-4">
                            We only store the minimum data necessary to provide the service:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-faint">
                            <li>
                                <strong>Secrets:</strong> Encrypted content (as binary data), salt,
                                expiration time, view count, and optional settings (password hash,
                                IP restrictions)
                            </li>
                            <li>
                                <strong>Files:</strong> Encrypted file data and filename (if you
                                attach files to a secret)
                            </li>
                            <li>
                                <strong>User accounts:</strong> Email, username, and authentication
                                data (only if you create an account)
                            </li>
                            <li>
                                <strong>Analytics:</strong> Anonymous visitor ID (hashed), page
                                path, and timestamp
                            </li>
                        </ul>
                        <p className="mt-4">
                            We do not store your plaintext secrets, decryption keys, or your IP
                            address.
                        </p>
                    </section>

                    <section>
                        <h2 className="m-0 mb-2.5 text-lg font-medium tracking-tight text-fg">
                            Contact Information
                        </h2>
                        <p>
                            If you have any questions about our privacy practices, please feel free
                            to contact us through our{' '}
                            <a
                                href="https://github.com/HemmeligOrg/Hemmelig.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline"
                            >
                                GitHub repository
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
