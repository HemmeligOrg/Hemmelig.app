import {
    IconBold,
    IconBrandCodesandbox,
    IconCode,
    IconCopy,
    IconCreditCard,
    IconDatabase,
    IconFileText,
    IconH1,
    IconH2,
    IconH3,
    IconItalic,
    IconKey,
    IconLetterP,
    IconLink,
    IconLinkOff,
    IconList,
    IconListNumbers,
    IconMail,
    IconNumber64Small,
    IconPassword,
    IconQuote,
    IconRefresh,
    IconServer,
    IconSourceCode,
    IconStrikethrough,
} from '@tabler/icons-react';
import CharacterCount from '@tiptap/extension-character-count';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import { TextStyle } from '@tiptap/extension-text-style';
import { EditorProvider, useCurrentEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { generate } from 'generate-password-browser';
import {
    createContext,
    FC,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// Context for passing onChange to MenuBar
const EditorOnChangeContext = createContext<((content: string) => void) | undefined>(undefined);

interface PasswordOptions {
    numbers: boolean;
    symbols: boolean;
    uppercase: boolean;
    lowercase: boolean;
}

const generatePassword = (
    length = 16,
    options: PasswordOptions = { numbers: true, symbols: true, uppercase: true, lowercase: true }
) => {
    const password = generate({
        length,
        numbers: options.numbers,
        symbols: options.symbols,
        uppercase: options.uppercase,
        lowercase: options.lowercase,
    });

    return password;
};

// Tooltip component for buttons
interface TooltipProps {
    text: string;
    children: ReactNode;
}
const Tooltip: FC<TooltipProps> = ({ text, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
                {children}
            </div>
            {isVisible && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-gray-900 dark:text-white bg-white dark:bg-dark-800 shadow-sm whitespace-nowrap z-10">
                    {text}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-dark-800"></div>
                </div>
            )}
        </div>
    );
};

// Template definitions
interface Template {
    id: string;
    nameKey: string;
    icon: ReactNode;
    content: string;
}

const templates: Template[] = [
    {
        id: 'credentials',
        nameKey: 'template_selector.templates.credentials',
        icon: <IconPassword size={16} />,
        content: `<p><strong>Login Credentials</strong></p>
<p>Username: </p>
<p>Password: </p>
<p>URL: </p>
<p>Notes: </p>`,
    },
    {
        id: 'api_key',
        nameKey: 'template_selector.templates.api_key',
        icon: <IconKey size={16} />,
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
        icon: <IconDatabase size={16} />,
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
        icon: <IconServer size={16} />,
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
        icon: <IconCreditCard size={16} />,
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
        icon: <IconMail size={16} />,
        content: `<p><strong>Email Account</strong></p>
<p>Email: </p>
<p>Password: </p>
<p>IMAP Server: </p>
<p>SMTP Server: </p>
<p>Recovery Email: </p>`,
    },
];

// Template Dropdown Component for toolbar
interface TemplateDropdownProps {
    onSelect: (content: string) => void;
    disabled?: boolean;
    buttonClass: string;
}

const TemplateDropdown: FC<TemplateDropdownProps> = ({ onSelect, disabled, buttonClass }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();

    const handleSelect = (template: Template) => {
        onSelect(template.content);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <Tooltip text={t('template_selector.button')}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                    <IconFileText
                        size={18}
                        stroke={1.5}
                        className="text-gray-600 dark:text-slate-300 mx-auto"
                    />
                </button>
            </Tooltip>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
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
};

// Password Dropdown Component for toolbar
interface PasswordDropdownProps {
    onInsert: (password: string) => void;
    buttonClass: string;
}

const PasswordDropdown: FC<PasswordDropdownProps> = ({ onInsert, buttonClass }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [passwordLength, setPasswordLength] = useState(16);
    const [options, setOptions] = useState<PasswordOptions>({
        numbers: true,
        symbols: true,
        uppercase: true,
        lowercase: true,
    });
    const [password, setPassword] = useState(() => generatePassword(16, options));
    const { t } = useTranslation();

    const regeneratePassword = () => {
        setPassword(generatePassword(passwordLength, options));
    };

    const handleOptionChange = (option: keyof PasswordOptions) => {
        const newOptions = { ...options, [option]: !options[option] };
        if (Object.values(newOptions).some((value) => value)) {
            setOptions(newOptions);
            setPassword(generatePassword(passwordLength, newOptions));
        }
    };

    const handleInsert = () => {
        onInsert(password);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <Tooltip text={t('editor.tooltips.insert_password')}>
                <button type="button" onClick={() => setIsOpen(!isOpen)} className={buttonClass}>
                    <IconKey
                        size={18}
                        stroke={1.5}
                        className="text-gray-600 dark:text-slate-300 mx-auto"
                    />
                </button>
            </Tooltip>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 w-72 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 shadow-lg">
                        <div className="p-3 border-b border-gray-200 dark:border-dark-600">
                            <p className="text-xs font-medium text-gray-700 dark:text-slate-300">
                                {t('editor.password_modal.title')}
                            </p>
                        </div>
                        <div className="p-3 space-y-3">
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">
                                    {t('editor.password_modal.length_label')}: {passwordLength}
                                </label>
                                <input
                                    type="range"
                                    min="8"
                                    max="32"
                                    value={passwordLength}
                                    onChange={(e) => {
                                        const newLength = parseInt(e.target.value);
                                        setPasswordLength(newLength);
                                        setPassword(generatePassword(newLength, options));
                                    }}
                                    className="w-full accent-teal-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-1">
                                <label className="flex items-center text-xs text-gray-600 dark:text-slate-400">
                                    <input
                                        type="checkbox"
                                        checked={options.numbers}
                                        onChange={() => handleOptionChange('numbers')}
                                        className="mr-1.5 accent-teal-500"
                                    />
                                    {t('editor.password_modal.include_numbers')}
                                </label>
                                <label className="flex items-center text-xs text-gray-600 dark:text-slate-400">
                                    <input
                                        type="checkbox"
                                        checked={options.symbols}
                                        onChange={() => handleOptionChange('symbols')}
                                        className="mr-1.5 accent-teal-500"
                                    />
                                    {t('editor.password_modal.include_symbols')}
                                </label>
                                <label className="flex items-center text-xs text-gray-600 dark:text-slate-400">
                                    <input
                                        type="checkbox"
                                        checked={options.uppercase}
                                        onChange={() => handleOptionChange('uppercase')}
                                        className="mr-1.5 accent-teal-500"
                                    />
                                    {t('editor.password_modal.include_uppercase')}
                                </label>
                                <label className="flex items-center text-xs text-gray-600 dark:text-slate-400">
                                    <input
                                        type="checkbox"
                                        checked={options.lowercase}
                                        onChange={() => handleOptionChange('lowercase')}
                                        className="mr-1.5 accent-teal-500"
                                    />
                                    {t('editor.password_modal.include_lowercase')}
                                </label>
                            </div>

                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    value={password}
                                    readOnly
                                    className="flex-1 px-2 py-1.5 text-xs bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={regeneratePassword}
                                    className="px-2 py-1.5 bg-gray-100 dark:bg-dark-600 border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-dark-500"
                                    title={t('editor.password_modal.refresh')}
                                >
                                    <IconRefresh size={14} />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleInsert}
                                className="w-full px-3 py-1.5 bg-teal-500 text-white text-xs font-medium hover:bg-teal-600 transition-colors"
                            >
                                {t('editor.password_modal.insert')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Link Dropdown Component for toolbar
interface LinkDropdownProps {
    onSubmit: (url: string) => void;
    buttonClass: string;
    activeButtonClass: string;
    isActive: boolean;
    initialUrl?: string;
}

const LinkDropdown: FC<LinkDropdownProps> = ({
    onSubmit,
    buttonClass,
    activeButtonClass,
    isActive,
    initialUrl = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState(initialUrl);
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setUrl(initialUrl);
        }
    }, [isOpen, initialUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(url);
        setIsOpen(false);
        setUrl('');
    };

    return (
        <div className="relative">
            <Tooltip text={t('editor.tooltips.link')}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={isActive ? activeButtonClass : buttonClass}
                >
                    <IconLink
                        size={18}
                        stroke={1.5}
                        className="text-gray-600 dark:text-slate-300 mx-auto"
                    />
                </button>
            </Tooltip>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 w-72 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 shadow-lg">
                        <div className="p-3 border-b border-gray-200 dark:border-dark-600">
                            <p className="text-xs font-medium text-gray-700 dark:text-slate-300">
                                {t('editor.link_modal.title')}
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-3 space-y-3">
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">
                                    {t('editor.link_modal.url_label')}
                                </label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder={t('editor.link_modal.url_placeholder')}
                                    className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full px-3 py-1.5 bg-teal-500 text-white text-xs font-medium hover:bg-teal-600 transition-colors"
                            >
                                {initialUrl
                                    ? t('editor.link_modal.update')
                                    : t('editor.link_modal.insert')}
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

// ReadOnlyMenuBar component for non-editable mode
const ReadOnlyMenuBar: FC = () => {
    const { editor } = useCurrentEditor();
    const [copySuccess, setCopySuccess] = useState('');
    const { t } = useTranslation();

    if (!editor) {
        return null;
    }

    const copyAsHTML = () => {
        const html = editor.getHTML();
        navigator.clipboard
            .writeText(html)
            .then(() => {
                setCopySuccess(t('editor.copy_success.html'));
                setTimeout(() => setCopySuccess(''), 2000);
            })
            .catch((err) => {
                console.error('Failed to copy: ', err);
            });
    };

    const copyAsPlainText = () => {
        const text = editor.getText();
        navigator.clipboard
            .writeText(text)
            .then(() => {
                setCopySuccess(t('editor.copy_success.text'));
                setTimeout(() => setCopySuccess(''), 2000);
            })
            .catch((err) => {
                console.error('Failed to copy: ', err);
            });
    };

    const copyAsBase64 = () => {
        const text = editor.getText();
        // Convert to Base64 in a way that is safe for large strings
        const uint8Array = new TextEncoder().encode(text);
        let binaryString = '';
        for (const byte of uint8Array) {
            binaryString += String.fromCharCode(byte);
        }
        const base64Content = btoa(binaryString);

        navigator.clipboard
            .writeText(base64Content)
            .then(() => {
                setCopySuccess(t('editor.copy_success.base64'));
                setTimeout(() => setCopySuccess(''), 2000);
            })
            .catch((err) => {
                console.error('Failed to copy: ', err);
            });
    };

    const buttonClass =
        'p-2 bg-gray-200 dark:bg-dark-600/50 hover:bg-gray-300 dark:hover:bg-dark-500/50 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105';
    const groupClass = 'flex items-center gap-1';

    return (
        <div className="mb-4 flex w-full p-3 sm:p-4 bg-gray-50 dark:bg-dark-700/30 border border-gray-200 dark:border-dark-500/30">
            <div className="flex gap-2">
                <div className={groupClass}>
                    <Tooltip text={t('editor.tooltips.copy_text')}>
                        <button onClick={copyAsPlainText} className={buttonClass}>
                            <IconCopy
                                size={20}
                                stroke={1.5}
                                className="text-gray-600 dark:text-slate-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text={t('editor.tooltips.copy_html')}>
                        <button onClick={copyAsHTML} className={buttonClass}>
                            <IconSourceCode
                                size={20}
                                className="text-gray-600 dark:text-slate-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text={t('editor.tooltips.copy_base64')}>
                        <button onClick={copyAsBase64} className={buttonClass}>
                            <IconNumber64Small
                                size={20}
                                stroke={1.5}
                                className="text-gray-600 dark:text-slate-300"
                            />
                        </button>
                    </Tooltip>
                </div>
            </div>
            {copySuccess && (
                <div className="text-sm text-gray-700 dark:text-slate-200 animate-fade-in-out p-2">
                    {copySuccess}
                </div>
            )}
        </div>
    );
};

const MenuBar: FC = () => {
    const { editor } = useCurrentEditor();
    const onChange = useContext(EditorOnChangeContext);
    const [menuOpen, setMenuOpen] = useState(false);
    const { t } = useTranslation();

    const handleLinkSubmit = useCallback(
        (url: string) => {
            if (!editor) return;
            if (url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                return;
            }
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        },
        [editor]
    );

    const handlePasswordSubmit = useCallback(
        async (password: string) => {
            if (!editor) return;
            editor.chain().focus().insertContent(password).run();
            try {
                await navigator.clipboard.writeText(password);
                toast.success(t('editor.password_modal.copied_and_added'));
            } catch {
                toast.success(t('editor.password_modal.added'));
            }
        },
        [editor, t]
    );

    const handleTemplateSubmit = useCallback(
        (content: string) => {
            if (!editor) return;
            editor.commands.setContent(content);
            if (onChange) {
                onChange(content);
            }
        },
        [editor, onChange]
    );

    if (!editor) {
        return null;
    }

    // Check if editor has content (templates disabled when there's existing content)
    const editorHasContent = !editor.isEmpty;

    const buttonClass =
        'p-1.5 bg-gray-200 dark:bg-dark-600/50 hover:bg-gray-300 dark:hover:bg-dark-500/50 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105 min-w-[32px] touch-manipulation';
    const activeButtonClass =
        'p-1.5 bg-teal-500 text-white transition-all duration-200 min-w-[32px] touch-manipulation';

    const groupClass = 'flex items-center gap-0.5';

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <>
            <div className="md:mb-4">
                <div className="sm:hidden mb-2 flex justify-end">
                    <button
                        onClick={toggleMenu}
                        className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-dark-700/30 border border-gray-200 dark:border-dark-500/30 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                    >
                        <span className="text-sm font-medium">{t('editor.formatting_tools')}</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={menuOpen ? 'M19 9l-7 7-7-7' : 'M4 6h16M4 12h16M4 18h16'}
                            />
                        </svg>
                    </button>
                </div>

                <div
                    className={`${menuOpen ? 'block' : 'hidden'} sm:block p-2 sm:p-3 bg-gray-50 dark:bg-dark-700/30 border border-gray-200 dark:border-dark-500/30`}
                >
                    <div className="flex flex-col sm:flex-row sm:flex-nowrap gap-2 sm:gap-1 sm:items-center">
                        <div className={groupClass}>
                            <Tooltip text={t('editor.tooltips.bold')}>
                                <button
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    disabled={!editor.can().chain().focus().toggleBold().run()}
                                    className={
                                        editor.isActive('bold') ? activeButtonClass : buttonClass
                                    }
                                >
                                    <IconBold
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('editor.tooltips.italic')}>
                                <button
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                                    className={
                                        editor.isActive('italic') ? activeButtonClass : buttonClass
                                    }
                                >
                                    <IconItalic
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('editor.tooltips.strikethrough')}>
                                <button
                                    onClick={() => editor.chain().focus().toggleStrike().run()}
                                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                                    className={
                                        editor.isActive('strike') ? activeButtonClass : buttonClass
                                    }
                                >
                                    <IconStrikethrough
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('editor.tooltips.inline_code')}>
                                <button
                                    onClick={() => editor.chain().focus().toggleCode().run()}
                                    disabled={!editor.can().chain().focus().toggleCode().run()}
                                    className={
                                        editor.isActive('code') ? activeButtonClass : buttonClass
                                    }
                                >
                                    <IconCode
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <LinkDropdown
                                onSubmit={handleLinkSubmit}
                                buttonClass={buttonClass}
                                activeButtonClass={activeButtonClass}
                                isActive={editor.isActive('link')}
                                initialUrl={editor.getAttributes('link').href || ''}
                            />
                            <Tooltip text={t('editor.tooltips.remove_link')}>
                                <button
                                    onClick={() => editor.chain().focus().unsetLink().run()}
                                    disabled={!editor.isActive('link')}
                                    className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                    <IconLinkOff
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <PasswordDropdown
                                onInsert={handlePasswordSubmit}
                                buttonClass={buttonClass}
                            />
                            <TemplateDropdown
                                onSelect={handleTemplateSubmit}
                                disabled={editorHasContent}
                                buttonClass={buttonClass}
                            />
                        </div>

                        <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-dark-600 mx-1"></div>
                        <div className="block sm:hidden w-full h-px bg-gray-300 dark:bg-dark-600 my-1"></div>

                        <div className={groupClass}>
                            <Tooltip text={t('editor.tooltips.paragraph')}>
                                <button
                                    onClick={() => editor.chain().focus().setParagraph().run()}
                                    className={
                                        editor.isActive('paragraph')
                                            ? activeButtonClass
                                            : buttonClass
                                    }
                                >
                                    <IconLetterP
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('editor.tooltips.heading1')}>
                                <button
                                    onClick={() =>
                                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                                    }
                                    className={
                                        editor.isActive('heading', { level: 1 })
                                            ? activeButtonClass
                                            : buttonClass
                                    }
                                >
                                    <IconH1
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('editor.tooltips.heading2')}>
                                <button
                                    onClick={() =>
                                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                                    }
                                    className={
                                        editor.isActive('heading', { level: 2 })
                                            ? activeButtonClass
                                            : buttonClass
                                    }
                                >
                                    <IconH2
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('editor.tooltips.heading3')}>
                                <button
                                    onClick={() =>
                                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                                    }
                                    className={
                                        editor.isActive('heading', { level: 3 })
                                            ? activeButtonClass
                                            : buttonClass
                                    }
                                >
                                    <IconH3
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-dark-600 mx-1"></div>
                        <div className="block sm:hidden w-full h-px bg-gray-300 dark:bg-dark-600 my-1"></div>

                        <div className={groupClass}>
                            <Tooltip text={t('editor.tooltips.bullet_list')}>
                                <button
                                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                                    className={
                                        editor.isActive('bulletList')
                                            ? activeButtonClass
                                            : buttonClass
                                    }
                                >
                                    <IconList
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('editor.tooltips.numbered_list')}>
                                <button
                                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                    className={
                                        editor.isActive('orderedList')
                                            ? activeButtonClass
                                            : buttonClass
                                    }
                                >
                                    <IconListNumbers
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('editor.tooltips.blockquote')}>
                                <button
                                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                    className={
                                        editor.isActive('blockquote')
                                            ? activeButtonClass
                                            : buttonClass
                                    }
                                >
                                    <IconQuote
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('editor.tooltips.code_block')}>
                                <button
                                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                    className={
                                        editor.isActive('codeBlock')
                                            ? activeButtonClass
                                            : buttonClass
                                    }
                                >
                                    <IconBrandCodesandbox
                                        size={18}
                                        stroke={1.5}
                                        className="text-gray-600 dark:text-slate-300 mx-auto"
                                    />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const extensions = [
    Color.configure({ types: [TextStyle.name, ListItem.name] }),
    TextStyle.configure(),
    Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https'],
        validate: (href) => /^https?:\/\//.test(href),
    }),
    StarterKit.configure({
        bulletList: {
            keepMarks: true,
            keepAttributes: false,
        },
        orderedList: {
            keepMarks: true,
            keepAttributes: false,
        },
    }),
    CharacterCount,
];

interface EditorProps {
    value?: string;
    onChange?: (content: string) => void;
    editable?: boolean;
    onEditorReady?: (editor: { setContent: (content: string) => void }) => void;
}

export default function Editor({
    value = '',
    onChange,
    editable = true,
    onEditorReady,
    ...props
}: EditorProps) {
    const [characterCount, setCharacterCount] = useState(0);
    return (
        <EditorOnChangeContext.Provider value={onChange}>
            <div className="space-y-3 sm:space-y-4 relative">
                <EditorProvider
                    slotBefore={editable ? <MenuBar /> : <ReadOnlyMenuBar />}
                    extensions={extensions}
                    editable={editable}
                    content={value}
                    onUpdate={({ editor }) => {
                        if (onChange) {
                            if (editor.isEmpty) {
                                onChange('');
                            } else {
                                onChange(editor.getHTML());
                            }
                        }
                        setCharacterCount(editor.storage.characterCount.characters());
                    }}
                    onCreate={({ editor }) => {
                        setCharacterCount(editor.storage.characterCount.characters());
                        if (onEditorReady) {
                            onEditorReady({
                                setContent: (content: string) => {
                                    editor.commands.setContent(content);
                                    if (onChange) {
                                        onChange(content);
                                    }
                                },
                            });
                        }
                    }}
                    editorProps={{
                        attributes: {
                            class: 'w-full min-h-[12rem] sm:min-h-[16rem] p-4 sm:p-6 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300 text-sm sm:text-base prose prose-sm max-w-none prose-headings:mt-6 prose-headings:first:mt-0 prose-headings:text-gray-900 dark:prose-headings:text-slate-100 prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:mb-3 prose-p:my-3 prose-p:leading-relaxed prose-p:text-gray-800 dark:prose-p:text-slate-200 prose-strong:text-gray-900 dark:prose-strong:text-slate-200 prose-strong:font-bold prose-em:text-gray-800 dark:prose-em:text-slate-200 prose-ul:pl-5 prose-ul:my-3 prose-ol:pl-5 prose-ol:my-3 prose-li:my-1 prose-li:leading-normal prose-li:text-gray-800 dark:prose-li:text-slate-200 prose-a:text-teal-600 dark:prose-a:text-teal-400 prose-a:underline prose-a:font-medium hover:prose-a:text-teal-500 dark:hover:prose-a:text-teal-300 prose-code:bg-gray-200 dark:prose-code:bg-dark-800 prose-code:text-gray-800 dark:prose-code:text-slate-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-pre:bg-gray-200 dark:prose-pre:bg-dark-900 prose-pre:text-gray-900 dark:prose-pre:text-white prose-pre:p-4 prose-pre:my-4 prose-pre:overflow-auto prose-pre:code:bg-transparent prose-pre:code:p-0 prose-pre:code:text-sm prose-pre:code:font-mono prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-dark-500 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:my-4 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-slate-300 prose-hr:my-6 prose-hr:border-gray-300 dark:prose-hr:border-dark-600',
                        },
                    }}
                    {...props}
                >
                    <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 text-xs text-gray-500 dark:text-slate-400 bg-white dark:bg-dark-800/80 px-2 py-1 rounded">
                        {characterCount} characters
                    </div>
                </EditorProvider>
            </div>
        </EditorOnChangeContext.Provider>
    );
}
