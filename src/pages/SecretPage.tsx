import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { decrypt, generateEncryptionKey } from '../lib/nacl';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Copy, Check } from 'lucide-react';

export function SecretPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [secretContent, setSecretContent] = useState<string | null>(null);
    const [title, setTitle] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [passwordInput, setPasswordInput] = useState<string>('');
    const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
    const [showSecretContent, setShowSecretContent] = useState<boolean>(false);
    const [viewsRemaining, setViewsRemaining] = useState<number | null>(null);

    const decryptionKey = location.hash.startsWith('#decryptionKey=') ? location.hash.substring('#decryptionKey='.length) : '';

    useEffect(() => {
        const checkSecretStatus = async () => {
            if (!id) {
                setError('Secret ID is missing.');
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.secrets[':id'].check.$get({ param: { id } });
                const data = await response.json();

                if (response.status === 200) {
                    setIsPasswordProtected(data.isPasswordProtected);
                    setViewsRemaining(data.views);

                    if (!data.isPasswordProtected) {
                        await fetchSecretContent(''); // Fetch immediately if no password is required
                    }
                } else {
                    setError(data.message || 'Failed to check secret status.');
                }
            } catch (err: any) {
                console.error('Error checking secret status:', err);
                setError('An error occurred while checking secret status.');
            } finally {
                setIsLoading(false);
            }
        };

        checkSecretStatus();
    }, [id, decryptionKey]);

    const fetchSecretContent = async (password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const finalDecryptionKey = password ? generateEncryptionKey(password) : decryptionKey;
            const response = await api.secrets[':id'].$post({ param: { id: id! }, json: { password: finalDecryptionKey } });
            const data = await response.json();

            if (response.status === 200 && data.secret) {
                const decryptedSecret = decrypt(new Uint8Array(Object.values(data.secret)), finalDecryptionKey);
                const decryptedTitle = data.title ? decrypt(new Uint8Array(Object.values(data.title)), finalDecryptionKey) : null;
                setSecretContent(decryptedSecret);
                setTitle(decryptedTitle);
                setShowSecretContent(true);
            } else {
                setError(data.message || 'Failed to retrieve secret.');
            }
        } catch (err: any) {
            console.error('Error fetching secret:', err);
            setError('An error occurred while fetching the secret.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const copyToClipboard = () => {
        if (secretContent) {
            navigator.clipboard.writeText(secretContent);
            setCopied(true);
        }
    };

    const handleViewSecret = () => {
        fetchSecretContent(passwordInput);
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-4xl text-white text-center">
                    <p>Loading secret...</p>
                </main>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-4xl text-white text-center">
                    <p className="text-red-500">Error: {error}</p>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
                    {title && <h2 className="text-2xl font-bold text-white mb-4">Title: {title}</h2>}
                    {viewsRemaining !== null && (
                        <p className="text-slate-400 mb-4">Views remaining: {viewsRemaining}</p>
                    )}

                    {!showSecretContent && isPasswordProtected && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-300">Password</label>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full mt-1 pl-4 pr-10 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none"
                                placeholder="Enter password to view secret"
                            />
                            <button
                                onClick={handleViewSecret}
                                className="px-4 py-2 bg-teal-500 text-white rounded-lg"
                            >
                                View Secret
                            </button>
                        </div>
                    )}

                    {showSecretContent && (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-4">Your Secret</h2>
                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={secretContent || ''}
                                    className="w-full h-96 mt-1 p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none resize-none"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className="absolute top-4 right-4 flex items-center p-2 rounded-lg bg-slate-600/50 hover:bg-slate-500/50 transition-colors"
                                >
                                    {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-slate-400 hover:text-white" />}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
