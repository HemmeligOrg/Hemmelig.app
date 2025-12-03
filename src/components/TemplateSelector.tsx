import { useState } from 'react';
import { FileText, ChevronDown, Key, Database, Server, CreditCard, Mail, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Template {
    id: string;
    nameKey: string;
    icon: React.ReactNode;
    content: string;
}

const templates: Template[] = [
    {
        id: 'credentials',
        nameKey: 'template_selector.templates.credentials',
        icon: <Key className="w-4 h-4" />,
        content: `<p><strong>Login Credentials</strong></p>
<p>Username: </p>
<p>Password: </p>
<p>URL: </p>
<p>Notes: </p>`,
    },
    {
        id: 'api_key',
        nameKey: 'template_selector.templates.api_key',
        icon: <Code className="w-4 h-4" />,
        content: `<p><strong>API Key</strong></p>
<p>Service: </p>
<p>API Key: </p>
<p>API Secret: </p>
<p>Environment: </p>
<p>Expires: </p>`,
    },
    {
        id: 'database',
        nameKey: 'template_selector.templates.database',
        icon: <Database className="w-4 h-4" />,
        content: `<p><strong>Database Credentials</strong></p>
<p>Host: </p>
<p>Port: </p>
<p>Database: </p>
<p>Username: </p>
<p>Password: </p>
<p>SSL: </p>`,
    },
    {
        id: 'server',
        nameKey: 'template_selector.templates.server',
        icon: <Server className="w-4 h-4" />,
        content: `<p><strong>Server Access</strong></p>
<p>Hostname: </p>
<p>IP Address: </p>
<p>SSH Port: </p>
<p>Username: </p>
<p>Password / Key: </p>
<p>Notes: </p>`,
    },
    {
        id: 'credit_card',
        nameKey: 'template_selector.templates.credit_card',
        icon: <CreditCard className="w-4 h-4" />,
        content: `<p><strong>Payment Card</strong></p>
<p>Cardholder Name: </p>
<p>Card Number: </p>
<p>Expiry Date: </p>
<p>CVV: </p>
<p>Billing Address: </p>`,
    },
    {
        id: 'email',
        nameKey: 'template_selector.templates.email',
        icon: <Mail className="w-4 h-4" />,
        content: `<p><strong>Email Account</strong></p>
<p>Email: </p>
<p>Password: </p>
<p>IMAP Server: </p>
<p>SMTP Server: </p>
<p>Recovery Email: </p>`,
    },
];

interface TemplateSelectorProps {
    onSelect: (content: string) => void;
    disabled?: boolean;
}

export function TemplateSelector({ onSelect, disabled }: TemplateSelectorProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (template: Template) => {
        onSelect(template.content);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FileText className="w-4 h-4" />
                <span>{t('template_selector.button')}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 shadow-lg">
                        <div className="p-2 border-b border-gray-200 dark:border-dark-600">
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                {t('template_selector.description')}
                            </p>
                        </div>
                        <div className="py-1">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleSelect(template)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-left"
                                >
                                    <span className="text-gray-500 dark:text-slate-400">
                                        {template.icon}
                                    </span>
                                    <span>{t(template.nameKey)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
