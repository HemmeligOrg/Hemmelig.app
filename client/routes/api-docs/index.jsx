import { IconFingerprint } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const ApiDocs = () => {
    const { t } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-white">API Documentation</h1>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">
                        How can I use Hemmelig programmatically?
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                        First, you need to{' '}
                        <Link
                            to="/signin"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            create an account
                        </Link>{' '}
                        to obtain your basic auth token.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">Authentication</h2>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1 text-blue-400">
                                <IconFingerprint size={20} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-gray-300">
                                    All API endpoints require Basic Authentication. Use your API
                                    token as the username and any value (or empty) as the password.
                                </p>
                                <pre className="bg-gray-900/50 p-3 rounded-md text-gray-300 overflow-x-auto">
                                    <code>Authorization: Basic {'{base64(api_token:)'}'}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">Endpoints</h2>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-4">Create Secret</h3>
                        <div className="space-y-3">
                            <div>
                                <span
                                    className="inline-block px-2 py-1 text-sm font-medium bg-green-500/20 
                                               text-green-400 rounded"
                                >
                                    POST
                                </span>
                                <span className="ml-2 text-gray-300">/api/v1/secret</span>
                            </div>
                            <pre className="bg-gray-900/50 p-3 rounded-md text-gray-300 overflow-x-auto">
                                <code>
                                    {JSON.stringify(
                                        {
                                            message: 'Your secret message',
                                            expiration: '1h',
                                            password: 'optional_password',
                                        },
                                        null,
                                        2
                                    )}
                                </code>
                            </pre>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ApiDocs;
