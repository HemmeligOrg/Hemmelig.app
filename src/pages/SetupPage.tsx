import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import Logo from '../components/Logo';

export function SetupPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error(t('setup_page.passwords_mismatch'));
            return;
        }

        if (formData.password.length < 8) {
            toast.error(t('setup_page.password_too_short'));
            return;
        }

        setIsLoading(true);

        try {
            const res = await api.setup.complete.$post({
                json: {
                    name: formData.name,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Setup failed');
            }

            toast.success(t('setup_page.success'));
            navigate('/login');
        } catch (error) {
            console.error('Setup failed:', error);
            toast.error(error instanceof Error ? error.message : t('setup_page.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center mb-4">
                            <Logo className="w-16 h-16 fill-gray-900 dark:fill-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('setup_page.title')}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 mt-2">
                            {t('setup_page.description')}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                {t('setup_page.name_label')}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-dark-700 border border-gray-300 dark:border-dark-500 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                                    placeholder={t('setup_page.name_placeholder')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                {t('setup_page.username_label')}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    minLength={3}
                                    maxLength={32}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-dark-700 border border-gray-300 dark:border-dark-500 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                                    placeholder={t('setup_page.username_placeholder')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                {t('setup_page.email_label')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-dark-700 border border-gray-300 dark:border-dark-500 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                                    placeholder={t('setup_page.email_placeholder')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                {t('setup_page.password_label')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-dark-700 border border-gray-300 dark:border-dark-500 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                                    placeholder={t('setup_page.password_placeholder')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                {t('setup_page.confirm_password_label')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-dark-700 border border-gray-300 dark:border-dark-500 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                                    placeholder={t('setup_page.confirm_password_placeholder')}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? t('setup_page.creating') : t('setup_page.create_admin')}
                        </button>
                    </form>

                    <p className="text-xs text-gray-500 dark:text-slate-400 text-center mt-6">
                        {t('setup_page.note')}
                    </p>
                </div>
            </div>
        </div>
    );
}
