import { useCallback, useEffect, useState } from 'react';
import { useParams, useLocation, useLoaderData } from 'react-router-dom';
import { api } from '../lib/api';
import { decrypt, generateEncryptionKey, decryptFile } from '../lib/nacl';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Loader2, Eye, Hash, File as FileIcon, Download } from 'lucide-react';
import Editor from '../components/Editor';
import { useTranslation } from 'react-i18next';

interface File {
    id: string;
    filename: string;
}

export function SecretPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const initialData = useLoaderData() as { isPasswordProtected: boolean, views: number, files: File[] };
    const [secretContent, setSecretContent] = useState<string | null>(null);
    const [title, setTitle] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordInput, setPasswordInput] = useState<string>('');
    const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
    const [showSecretContent, setShowSecretContent] = useState<boolean>(false);
    const [viewsRemaining, setViewsRemaining] = useState<number | null>(null);

    const decryptionKey = location.hash.startsWith('#decryptionKey=') ? location.hash.substring('#decryptionKey='.length) : '';

    const fetchSecretContent = useCallback(async (password: string) => {
        setIsLoading(true);
        try {
            const finalDecryptionKey = password ? generateEncryptionKey(password) : decryptionKey;
            const response = await api.secrets[':id'].$post({ param: { id: id! }, json: { password: finalDecryptionKey } });
            const data = await response.json();

            if (response.status === 200 && data.secret) {
                const decryptedSecret = decrypt(new Uint8Array(Object.values(data.secret)), finalDecryptionKey);
                const decryptedTitle = data.title ? decrypt(new Uint8Array(Object.values(data.title)), finalDecryptionKey) : null;
                setSecretContent(decryptedSecret);
                setTitle(decryptedTitle);
                setFiles(data.files);
                setShowSecretContent(true);
                setViewsRemaining(prev => (prev !== null ? prev - 1 : null));
            }
        } catch (err: unknown) {
            console.error('Error fetching secret:', err);
        } finally {
            setIsLoading(false);
        }
    }, [decryptionKey, id]);

    useEffect(() => {
        if (initialData) {
            setIsPasswordProtected(initialData.isPasswordProtected);
            setViewsRemaining(initialData.views);
            setFiles(initialData.files);
        }
    }, [initialData]);

    const handleViewSecret = () => {
        fetchSecretContent(passwordInput);
    };

    const handleDownload = async (file: File) => {
        const finalDecryptionKey = passwordInput ? generateEncryptionKey(passwordInput) : decryptionKey;
        const response = await api.files[':id'].$get({ param: { id: file.id } });
        const encryptedFile = await response.arrayBuffer();
        const decryptedFile = decryptFile(new Uint8Array(encryptedFile), finalDecryptionKey);
        const blob = new Blob([decryptedFile]);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = file.filename.split('-').slice(1).join('-');
        link.click();
        URL.revokeObjectURL(link.href);
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
                            <div className="relative inline-block" title={t('secret_page.views_remaining_tooltip', { count: viewsRemaining })}>
                                <div className="flex items-center text-slate-400">
                                    <Eye className="h-5 w-5 mr-2" />
                                    <span>{viewsRemaining}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {isLoading && (
                        <div className="flex justify-center items-center text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span>{t('secret_page.loading_message')}</span>
                        </div>
                    )}

                    {!isLoading && !showSecretContent && (
                        <div className="space-y-4">
                            {isPasswordProtected && (
                                <>
                                    <label className="block text-sm font-medium text-slate-300">{t('secret_page.password_label')}</label>
                                    <input
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        className="w-full mt-1 pl-4 pr-10 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none"
                                        placeholder={t('secret_page.password_placeholder')}
                                    />
                                </>
                            )}
                            <button
                                onClick={handleViewSecret}
                                className="px-4 py-2 bg-teal-500 text-white rounded-lg"
                            >
                                {t('secret_page.view_secret_button')}
                            </button>
                        </div>
                    )}

                    {showSecretContent && (
                        <>
                            <Editor value={secretContent || ''} editable={false} />
                            {files && files.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-white mb-2">{t('secret_page.files_title')}</h3>
                                    <div className="space-y-2">
                                        {files.map(file => (
                                            <div key={file.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <FileIcon className="w-5 h-5 text-slate-400" />
                                                    <span className="text-sm text-slate-300">{file.filename.split('-').slice(1).join('-')}</span>
                                                </div>
                                                <button onClick={() => handleDownload(file)} className="p-2 text-slate-400 hover:text-white">
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
