import { useEffect, useState } from 'react';
import { useParams, useLocation, useLoaderData } from 'react-router-dom';
import { api } from '../lib/api';
import { decrypt, generateEncryptionKey } from '../lib/nacl';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Copy, Check, Loader2, Eye, Hash } from 'lucide-react';
import Editor from '../components/Editor';

export function SecretPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const initialData = useLoaderData();
    const [secretContent, setSecretContent] = useState<string | null>(null);
    const [title, setTitle] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [passwordInput, setPasswordInput] = useState<string>('');
    const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
    const [showSecretContent, setShowSecretContent] = useState<boolean>(false);
    const [viewsRemaining, setViewsRemaining] = useState<number | null>(null);

    const decryptionKey = location.hash.startsWith('#decryptionKey=') ? location.hash.substring('#decryptionKey='.length) : '';

    useEffect(() => {
        if (initialData) {
            setIsPasswordProtected(initialData.isPasswordProtected);
            setViewsRemaining(initialData.views);

            if (!initialData.isPasswordProtected) {
                fetchSecretContent(''); // Fetch immediately if no password is required
            }
        }
    }, [initialData]);

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
                setViewsRemaining(prev => (prev !== null ? prev - 1 : null));
            } else if (response.status === 401) {
                setError('You are not authorized to view this secret.');
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

    return (
        <>
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        {title && (
                            <div className="flex items-center text-2xl font-bold text-white">
                                <Hash className="h-6 w-6 mr-2 text-slate-400" />
                                <span>{title}</span>
                            </div>
                        )}
                        {viewsRemaining !== null && (
                            <div className="relative inline-block" title={`Views remaining: ${viewsRemaining}`}>
                                <div className="flex items-center text-slate-400">
                                    <Eye className="h-5 w-5 mr-2" />
                                    <span>{viewsRemaining}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-600/50 text-red-300 p-4 rounded-xl mb-6 text-center shadow-lg">
                            <p className="font-semibold text-lg">Error</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex justify-center items-center text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}

                    {!isLoading && !showSecretContent && isPasswordProtected && (
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
                        <Editor value={secretContent || ''} editable={false} />
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
