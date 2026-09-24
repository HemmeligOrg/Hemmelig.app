import {
    IconBold,
    IconBrandCodesandbox,
    IconCode,
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
    IconPassword,
    IconQuote,
    IconRefresh,
    IconServer,
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
import { Button } from './Button';
import { inputClassName } from './Input';

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

const toolButtonClass =
    'flex items-center justify-center w-7 h-7 rounded-sm text-muted hover:text-fg hover:bg-raised transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation';
const activeToolButtonClass =
    'flex items-center justify-center w-7 h-7 rounded-sm text-accent bg-accent/12 transition-colors cursor-pointer touch-manipulation';
const popoverClass =
    'absolute left-0 top-full mt-1 z-20 bg-surface border border-line rounded-md shadow-2xl';
const iconProps = { size: 16, stroke: 1.5 };

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
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-sm text-2xs font-mono text-canvas bg-fg whitespace-nowrap z-30 pointer-events-none">
                    {text}
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
}

const TemplateDropdown: FC<TemplateDropdownProps> = ({ onSelect, disabled }) => {
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
                    aria-label={t('template_selector.button')}
                    aria-expanded={isOpen}
                    className={toolButtonClass}
                >
                    <IconFileText {...iconProps} />
                </button>
            </Tooltip>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className={`${popoverClass} w-56`}>
                        <p className="px-3 py-2 border-b border-line-soft text-xs text-muted">
                            {t('template_selector.description')}
                        </p>
                        <div className="py-1">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleSelect(template)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-ui text-fg-2 hover:bg-raised hover:text-fg transition-colors text-left cursor-pointer"
                                >
                                    <span className="text-muted">{template.icon}</span>
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
}

const PasswordDropdown: FC<PasswordDropdownProps> = ({ onInsert }) => {
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

    const optionKeys: { key: keyof PasswordOptions; label: string }[] = [
        { key: 'numbers', label: t('editor.password_modal.include_numbers') },
        { key: 'symbols', label: t('editor.password_modal.include_symbols') },
        { key: 'uppercase', label: t('editor.password_modal.include_uppercase') },
        { key: 'lowercase', label: t('editor.password_modal.include_lowercase') },
    ];

    return (
        <div className="relative">
            <Tooltip text={t('editor.tooltips.insert_password')}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={t('editor.tooltips.insert_password')}
                    aria-expanded={isOpen}
                    className={toolButtonClass}
                >
                    <IconKey {...iconProps} />
                </button>
            </Tooltip>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className={`${popoverClass} w-72`}>
                        <p className="px-3 py-2 border-b border-line-soft text-ui font-medium">
                            {t('editor.password_modal.title')}
                        </p>
                        <div className="p-3 grid gap-3">
                            <label className="grid gap-1 text-xs text-muted">
                                <span>
                                    {t('editor.password_modal.length_label')}:{' '}
                                    <span className="font-mono text-fg">{passwordLength}</span>
                                </span>
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
                                    className="w-full accent-accent"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-1">
                                {optionKeys.map(({ key, label }) => (
                                    <label
                                        key={key}
                                        className="flex items-center gap-1.5 text-xs text-fg-3"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={options[key]}
                                            onChange={() => handleOptionChange(key)}
                                            className="accent-accent"
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    value={password}
                                    readOnly
                                    aria-label={t('editor.password_modal.generated_password')}
                                    className={inputClassName({
                                        mono: true,
                                        className: 'flex-1 !py-1.5 text-xs',
                                    })}
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={regeneratePassword}
                                    title={t('editor.password_modal.refresh')}
                                    aria-label={t('editor.password_modal.refresh')}
                                >
                                    <IconRefresh size={14} />
                                </Button>
                            </div>

                            <Button variant="primary" size="sm" onClick={handleInsert}>
                                {t('editor.password_modal.insert')}
                            </Button>
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
    isActive: boolean;
    initialUrl?: string;
}

const LinkDropdown: FC<LinkDropdownProps> = ({ onSubmit, isActive, initialUrl = '' }) => {
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
                    onClick={() => {
                        // Start from the current link each time the dropdown opens.
                        if (!isOpen) setUrl(initialUrl);
                        setIsOpen(!isOpen);
                    }}
                    aria-label={t('editor.tooltips.link')}
                    aria-expanded={isOpen}
                    className={isActive ? activeToolButtonClass : toolButtonClass}
                >
                    <IconLink {...iconProps} />
                </button>
            </Tooltip>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className={`${popoverClass} w-72`}>
                        <p className="px-3 py-2 border-b border-line-soft text-ui font-medium">
                            {t('editor.link_modal.title')}
                        </p>
                        <form onSubmit={handleSubmit} className="p-3 grid gap-3">
                            <label className="grid gap-1 text-xs text-muted">
                                {t('editor.link_modal.url_label')}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder={t('editor.link_modal.url_placeholder')}
                                    className={inputClassName({ mono: true, className: 'text-xs' })}
                                />
                            </label>
                            <Button type="submit" variant="primary" size="sm">
                                {initialUrl
                                    ? t('editor.link_modal.update')
                                    : t('editor.link_modal.insert')}
                            </Button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

const Divider = () => <span aria-hidden="true" className="w-px h-4 bg-line-soft mx-1" />;

const MenuBar: FC = () => {
    const { editor } = useCurrentEditor();
    const onChange = useContext(EditorOnChangeContext);
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

    // Templates replace the content, so they are only available in an empty editor.
    const editorHasContent = !editor.isEmpty;

    const tool = (
        label: string,
        icon: ReactNode,
        onClick: () => void,
        isActive: boolean,
        disabled = false
    ) => (
        <Tooltip text={label}>
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
                aria-pressed={isActive}
                className={isActive ? activeToolButtonClass : toolButtonClass}
            >
                {icon}
            </button>
        </Tooltip>
    );

    return (
        <div
            role="toolbar"
            aria-label={t('editor.formatting_tools')}
            className="flex flex-wrap items-center gap-0.5 px-2.5 py-1.5 border-b border-line-soft"
        >
            {tool(
                t('editor.tooltips.bold'),
                <IconBold {...iconProps} />,
                () => editor.chain().focus().toggleBold().run(),
                editor.isActive('bold'),
                !editor.can().chain().focus().toggleBold().run()
            )}
            {tool(
                t('editor.tooltips.italic'),
                <IconItalic {...iconProps} />,
                () => editor.chain().focus().toggleItalic().run(),
                editor.isActive('italic'),
                !editor.can().chain().focus().toggleItalic().run()
            )}
            {tool(
                t('editor.tooltips.strikethrough'),
                <IconStrikethrough {...iconProps} />,
                () => editor.chain().focus().toggleStrike().run(),
                editor.isActive('strike'),
                !editor.can().chain().focus().toggleStrike().run()
            )}
            {tool(
                t('editor.tooltips.inline_code'),
                <IconCode {...iconProps} />,
                () => editor.chain().focus().toggleCode().run(),
                editor.isActive('code'),
                !editor.can().chain().focus().toggleCode().run()
            )}
            <LinkDropdown
                onSubmit={handleLinkSubmit}
                isActive={editor.isActive('link')}
                initialUrl={editor.getAttributes('link').href || ''}
            />
            {tool(
                t('editor.tooltips.remove_link'),
                <IconLinkOff {...iconProps} />,
                () => editor.chain().focus().unsetLink().run(),
                false,
                !editor.isActive('link')
            )}

            <Divider />

            {tool(
                t('editor.tooltips.paragraph'),
                <IconLetterP {...iconProps} />,
                () => editor.chain().focus().setParagraph().run(),
                editor.isActive('paragraph')
            )}
            {tool(
                t('editor.tooltips.heading1'),
                <IconH1 {...iconProps} />,
                () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
                editor.isActive('heading', { level: 1 })
            )}
            {tool(
                t('editor.tooltips.heading2'),
                <IconH2 {...iconProps} />,
                () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                editor.isActive('heading', { level: 2 })
            )}
            {tool(
                t('editor.tooltips.heading3'),
                <IconH3 {...iconProps} />,
                () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
                editor.isActive('heading', { level: 3 })
            )}

            <Divider />

            {tool(
                t('editor.tooltips.bullet_list'),
                <IconList {...iconProps} />,
                () => editor.chain().focus().toggleBulletList().run(),
                editor.isActive('bulletList')
            )}
            {tool(
                t('editor.tooltips.numbered_list'),
                <IconListNumbers {...iconProps} />,
                () => editor.chain().focus().toggleOrderedList().run(),
                editor.isActive('orderedList')
            )}
            {tool(
                t('editor.tooltips.blockquote'),
                <IconQuote {...iconProps} />,
                () => editor.chain().focus().toggleBlockquote().run(),
                editor.isActive('blockquote')
            )}
            {tool(
                t('editor.tooltips.code_block'),
                <IconBrandCodesandbox {...iconProps} />,
                () => editor.chain().focus().toggleCodeBlock().run(),
                editor.isActive('codeBlock')
            )}

            <Divider />

            <PasswordDropdown onInsert={handlePasswordSubmit} />
            <TemplateDropdown onSelect={handleTemplateSubmit} disabled={editorHasContent} />
        </div>
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
        link: false,
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

interface DocState {
    doc: {
        childCount: number;
        firstChild: { isTextblock: boolean; content: { size: number } } | null;
    };
}

/** The document is empty when it has one text block without content. */
const isDocEmpty = (state: DocState) => {
    const first = state.doc.firstChild;
    return state.doc.childCount === 1 && !!first?.isTextblock && first.content.size === 0;
};

const contentClass = [
    'relative w-full outline-none font-mono text-sm leading-relaxed text-fg',
    'prose prose-sm max-w-none',
    'prose-p:my-0 prose-p:text-fg prose-p:leading-relaxed',
    'prose-headings:text-fg prose-headings:font-medium prose-headings:mt-4 prose-headings:mb-2 prose-headings:first:mt-0',
    'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
    'prose-strong:text-fg prose-strong:font-semibold prose-em:text-fg',
    'prose-ul:my-2 prose-ul:pl-5 prose-ol:my-2 prose-ol:pl-5 prose-li:my-0.5 prose-li:text-fg prose-li:marker:text-muted',
    'prose-a:text-accent prose-a:underline',
    'prose-code:text-fg prose-code:bg-raised prose-code:px-1 prose-code:py-0.5 prose-code:rounded-xs prose-code:font-mono prose-code:font-normal prose-code:before:content-none prose-code:after:content-none',
    'prose-pre:bg-raised prose-pre:text-fg prose-pre:rounded-sm prose-pre:my-3 prose-pre:p-3',
    'prose-blockquote:border-l-2 prose-blockquote:border-line-strong prose-blockquote:text-fg-3 prose-blockquote:not-italic prose-blockquote:my-3 prose-blockquote:pl-3',
    'prose-hr:border-line-soft',
    'before:absolute before:top-4.5 before:left-4.5 before:text-faint before:pointer-events-none',
    'data-[empty=true]:before:content-[attr(data-placeholder)]',
].join(' ');

export interface EditorHandle {
    setContent: (content: string) => void;
    /** Returns the text content with one line break between blocks. */
    getText: () => string;
    getHTML: () => string;
}

interface EditorProps {
    value?: string;
    onChange?: (content: string) => void;
    editable?: boolean;
    placeholder?: string;
    /** The minimum height class of the editable area, for example `min-h-60`. */
    minHeightClassName?: string;
    onEditorReady?: (editor: EditorHandle) => void;
}

export default function Editor({
    value = '',
    onChange,
    editable = true,
    placeholder = '',
    minHeightClassName = 'min-h-60',
    onEditorReady,
    ...props
}: EditorProps) {
    const [characterCount, setCharacterCount] = useState(0);
    const { t } = useTranslation();

    return (
        <EditorOnChangeContext.Provider value={onChange}>
            <div className="relative">
                <EditorProvider
                    slotBefore={editable ? <MenuBar /> : undefined}
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
                                getText: () => editor.getText({ blockSeparator: '\n' }),
                                getHTML: () => editor.getHTML(),
                            });
                        }
                    }}
                    editorProps={{
                        attributes: (state) => ({
                            class: `${contentClass} ${editable ? `${minHeightClassName} p-4.5 pb-8` : 'px-4.5 py-5'}`,
                            'data-placeholder': placeholder,
                            'data-empty': String(editable && isDocEmpty(state)),
                        }),
                    }}
                    {...props}
                >
                    {editable && (
                        <div className="absolute bottom-2 right-3 font-mono text-2xs text-faint pointer-events-none">
                            {characterCount} {t('editor.character_count')}
                        </div>
                    )}
                </EditorProvider>
            </div>
        </EditorOnChangeContext.Provider>
    );
}
