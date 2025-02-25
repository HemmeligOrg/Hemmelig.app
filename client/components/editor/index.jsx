import {
    IconArrowBackUp,
    IconArrowForwardUp,
    IconBinary,
    IconBold,
    IconBrandCodesandbox,
    IconCode,
    IconCopy,
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
    IconQuote,
    IconStrikethrough,
    IconTextCaption,
    IconX,
} from '@tabler/icons';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import { EditorProvider, useCurrentEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { generate } from 'generate-password-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const generatePassword = (
    length = 16,
    options = { numbers: true, symbols: true, uppercase: true, lowercase: true }
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
const Tooltip = ({ text, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
                {children}
            </div>
            {isVisible && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded shadow-sm whitespace-nowrap z-10">
                    {text}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
            )}
        </div>
    );
};

// Link Modal Component
const LinkModal = ({ isOpen, onClose, onSubmit, initialUrl = '' }) => {
    const [url, setUrl] = useState(initialUrl);
    const inputRef = useRef(null);
    const { t } = useTranslation();

    // Focus the input when the modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus();
            }, 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(url);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-100">
                        {t('editor.link_modal.title')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
                        <IconX size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="url"
                            className="block text-sm font-medium text-gray-300 mb-2"
                        >
                            {t('editor.link_modal.url_label')}
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            id="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={t('editor.link_modal.url_placeholder')}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600"
                        >
                            {t('editor.link_modal.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-md "
                        >
                            {initialUrl
                                ? t('editor.link_modal.update')
                                : t('editor.link_modal.insert')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Password Modal Component
const PasswordModal = ({ isOpen, onClose, onSubmit }) => {
    const [passwordLength, setPasswordLength] = useState(16);
    const [password, setPassword] = useState(generatePassword(16));
    const [options, setOptions] = useState({
        numbers: true,
        symbols: true,
        uppercase: true,
        lowercase: true,
    });
    const { t } = useTranslation();

    if (!isOpen) return null;

    const regeneratePassword = () => {
        setPassword(generatePassword(passwordLength, options));
    };

    const handleOptionChange = (option) => {
        // Prevent disabling all options - at least one must be enabled
        const newOptions = { ...options, [option]: !options[option] };
        if (Object.values(newOptions).some((value) => value)) {
            setOptions(newOptions);
            setPassword(generatePassword(passwordLength, newOptions));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-100">
                        {t('editor.password_modal.title')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
                        <IconX size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('editor.password_modal.length_label')}
                        </label>
                        <div className="flex items-center mb-4">
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
                                className="w-full mr-3 accent-primary"
                                style={{
                                    // Fallback for browsers that don't support accent-color
                                    '--tw-accent-color': 'var(--color-primary)',
                                }}
                            />
                            <span className="text-gray-200 w-8 text-center">{passwordLength}</span>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('editor.password_modal.options_label')}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="numbers"
                                        checked={options.numbers}
                                        onChange={() => handleOptionChange('numbers')}
                                        className="mr-2 checked:bg-primary checked:hover:bg-primary/80 checked:focus:bg-primary/60 checked:active:bg-primary/60"
                                    />
                                    <label htmlFor="numbers" className="text-gray-300 text-sm">
                                        {t('editor.password_modal.include_numbers')}
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="symbols"
                                        checked={options.symbols}
                                        onChange={() => handleOptionChange('symbols')}
                                        className="mr-2 checked:bg-primary checked:hover:bg-primary/80 checked:active:bg-primary/60 checked:focus:bg-primary/60"
                                    />
                                    <label htmlFor="symbols" className="text-gray-300 text-sm">
                                        {t('editor.password_modal.include_symbols')}
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="uppercase"
                                        checked={options.uppercase}
                                        onChange={() => handleOptionChange('uppercase')}
                                        className="mr-2 checked:bg-primary checked:hover:bg-primary/80 checked:active:bg-primary/60 checked:focus:bg-primary/60"
                                    />
                                    <label htmlFor="uppercase" className="text-gray-300 text-sm">
                                        {t('editor.password_modal.include_uppercase')}
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="lowercase"
                                        checked={options.lowercase}
                                        onChange={() => handleOptionChange('lowercase')}
                                        className="mr-2 checked:bg-primary checked:hover:bg-primary/80 checked:active:bg-primary/60 checked:focus:bg-primary/60"
                                    />
                                    <label htmlFor="lowercase" className="text-gray-300 text-sm">
                                        {t('editor.password_modal.include_lowercase')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('editor.password_modal.generated_password')}
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                value={password}
                                readOnly
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-l-md text-gray-100"
                            />
                            <button
                                type="button"
                                onClick={regeneratePassword}
                                className="px-3 py-2 bg-primary text-gray-200 rounded-r-md hover:opacity-90"
                            >
                                {t('editor.password_modal.refresh')}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600"
                        >
                            {t('editor.password_modal.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
                        >
                            {t('editor.password_modal.insert')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ReadOnlyMenuBar component for non-editable mode
const ReadOnlyMenuBar = () => {
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
        // Convert to Base64
        const base64Content = btoa(
            new TextEncoder()
                .encode(text)
                .reduce((acc, byte) => acc + String.fromCharCode(byte), '')
        );
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
        'p-1.5 text-sm rounded-md hover:bg-gray-700 text-gray-200 transition-colors';
    const groupClass = 'flex items-center border border-gray-700 rounded-md bg-gray-800 shadow-sm';

    return (
        <div className="mb-4 flex w-full">
            <div className="flex gap-2">
                <div className={groupClass}>
                    <Tooltip text={t('editor.tooltips.copy_html')}>
                        <button onClick={copyAsHTML} className={buttonClass}>
                            <IconCopy size={18} stroke={1.5} className="text-gray-300" />
                        </button>
                    </Tooltip>
                    <Tooltip text={t('editor.tooltips.copy_text')}>
                        <button onClick={copyAsPlainText} className={buttonClass}>
                            <IconTextCaption size={18} stroke={1.5} className="text-gray-300" />
                        </button>
                    </Tooltip>
                    <Tooltip text={t('editor.tooltips.copy_base64')}>
                        <button onClick={copyAsBase64} className={buttonClass}>
                            <IconBinary size={18} stroke={1.5} className="text-gray-300" />
                        </button>
                    </Tooltip>
                </div>
            </div>
            {copySuccess && (
                <div className="text-sm text-green-400 animate-fade-in-out">{copySuccess}</div>
            )}
        </div>
    );
};

const MenuBar = ({ content }) => {
    const { editor } = useCurrentEditor();
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const { t } = useTranslation();

    if (!editor) {
        return null;
    }

    // If the content is empty, clear the editor content
    // this is a hack until I figure out how to handle this better
    useEffect(() => {
        if (content === '') {
            editor.commands.clearContent();
        }
    }, []);

    // Updated button styles without dark mode prefixes
    const buttonClass =
        'p-1.5 text-sm rounded-md hover:bg-gray-700 text-gray-200 transition-colors';
    const activeButtonClass =
        'p-1.5 text-sm rounded-md bg-blue-900/30 text-blue-400 transition-colors';

    // Updated group styles without dark mode prefixes
    const groupClass = 'flex items-center border border-gray-700 rounded-md bg-gray-800 shadow-sm';

    // Updated link handling function
    const openLinkModal = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href || '';
        setLinkModalOpen(true);
    }, [editor]);

    const handleLinkSubmit = useCallback(
        (url) => {
            // Empty
            if (url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                return;
            }

            // Add protocol if missing
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            // Update link
            try {
                editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            } catch (e) {
                alert(e.message);
            }
        },
        [editor]
    );

    // Password handling function
    const handlePasswordSubmit = useCallback(
        (password) => {
            editor.chain().focus().insertContent(password).run();
        },
        [editor]
    );

    return (
        <>
            <div className="mb-4">
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Text formatting group */}
                    <div className={groupClass}>
                        <Tooltip text={t('editor.tooltips.bold')}>
                            <button
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                disabled={!editor.can().chain().focus().toggleBold().run()}
                                className={
                                    editor.isActive('bold') ? activeButtonClass : buttonClass
                                }
                            >
                                <IconBold size={18} stroke={1.5} className="text-gray-300" />
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
                                <IconItalic size={18} stroke={1.5} className="text-gray-300" />
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
                                    className="text-gray-300"
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
                                <IconCode size={18} stroke={1.5} className="text-gray-300" />
                            </button>
                        </Tooltip>
                        <Tooltip text={t('editor.tooltips.link')}>
                            <button
                                onClick={openLinkModal}
                                className={
                                    editor.isActive('link') ? activeButtonClass : buttonClass
                                }
                            >
                                <IconLink size={18} stroke={1.5} className="text-gray-300" />
                            </button>
                        </Tooltip>
                        <Tooltip text={t('editor.tooltips.remove_link')}>
                            <button
                                onClick={() => editor.chain().focus().unsetLink().run()}
                                disabled={!editor.isActive('link')}
                                className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                <IconLinkOff size={18} stroke={1.5} className="text-gray-300" />
                            </button>
                        </Tooltip>
                        <Tooltip text={t('editor.tooltips.insert_password')}>
                            <button
                                onClick={() => setPasswordModalOpen(true)}
                                className={buttonClass}
                            >
                                <IconKey size={18} stroke={1.5} className="text-gray-300" />
                            </button>
                        </Tooltip>
                    </div>

                    {/* Paragraph formatting group */}
                    <div className={groupClass}>
                        <Tooltip text={t('editor.tooltips.paragraph')}>
                            <button
                                onClick={() => editor.chain().focus().setParagraph().run()}
                                className={
                                    editor.isActive('paragraph') ? activeButtonClass : buttonClass
                                }
                            >
                                <IconLetterP size={18} stroke={1.5} className="text-gray-300" />
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
                                <IconH1 size={18} stroke={1.5} className="text-gray-300" />
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
                                <IconH2 size={18} stroke={1.5} className="text-gray-300" />
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
                                <IconH3 size={18} stroke={1.5} className="text-gray-300" />
                            </button>
                        </Tooltip>
                    </div>

                    {/* List formatting group */}
                    <div className={groupClass}>
                        <Tooltip text={t('editor.tooltips.bullet_list')}>
                            <button
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                className={
                                    editor.isActive('bulletList') ? activeButtonClass : buttonClass
                                }
                            >
                                <IconList size={18} stroke={1.5} className="text-gray-300" />
                            </button>
                        </Tooltip>
                        <Tooltip text={t('editor.tooltips.numbered_list')}>
                            <button
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                className={
                                    editor.isActive('orderedList') ? activeButtonClass : buttonClass
                                }
                            >
                                <IconListNumbers size={18} stroke={1.5} className="text-gray-300" />
                            </button>
                        </Tooltip>
                        <Tooltip text={t('editor.tooltips.blockquote')}>
                            <button
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                className={
                                    editor.isActive('blockquote') ? activeButtonClass : buttonClass
                                }
                            >
                                <IconQuote size={18} stroke={1.5} className="text-gray-300" />
                            </button>
                        </Tooltip>
                        <Tooltip text={t('editor.tooltips.code_block')}>
                            <button
                                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                className={
                                    editor.isActive('codeBlock') ? activeButtonClass : buttonClass
                                }
                            >
                                <IconBrandCodesandbox
                                    size={18}
                                    stroke={1.5}
                                    className="text-gray-300"
                                />
                            </button>
                        </Tooltip>
                    </div>

                    {/* History controls */}
                    <div className={groupClass}>
                        <Tooltip text={t('editor.tooltips.undo')}>
                            <button
                                onClick={() => editor.chain().focus().undo().run()}
                                disabled={!editor.can().chain().focus().undo().run()}
                                className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                <IconArrowBackUp size={18} stroke={1.5} className="text-gray-300" />
                            </button>
                        </Tooltip>
                        <Tooltip text={t('editor.tooltips.redo')}>
                            <button
                                onClick={() => editor.chain().focus().redo().run()}
                                disabled={!editor.can().chain().focus().redo().run()}
                                className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                <IconArrowForwardUp
                                    size={18}
                                    stroke={1.5}
                                    className="text-gray-300"
                                />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* Link Modal */}
            <LinkModal
                isOpen={linkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onSubmit={handleLinkSubmit}
                initialUrl={editor?.getAttributes('link').href || ''}
            />

            {/* Password Modal */}
            <PasswordModal
                isOpen={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
                onSubmit={handlePasswordSubmit}
            />
        </>
    );
};

const extensions = [
    Color.configure({ types: [TextStyle.name, ListItem.name] }),
    TextStyle.configure({ types: [ListItem.name] }),
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
            keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
        orderedList: {
            keepMarks: true,
            keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
    }),
];

export default function Editor({ content = '', setContent, editable = true }) {
    return (
        <div className="prose prose-sm max-w-none border border-gray-700 rounded-md p-2 h-full flex flex-col">
            <EditorProvider
                slotBefore={editable ? <MenuBar content={content} /> : <ReadOnlyMenuBar />}
                extensions={extensions}
                editable={editable}
                content={content}
                onUpdate={({ editor }) => {
                    if (setContent) {
                        setContent(editor.getHTML());
                    }
                }}
                editorProps={{
                    attributes: {
                        class: 'flex-1 overflow-auto focus:outline-none text-gray-100 prose-headings:mt-6 prose-headings:first:mt-0 prose-headings:text-gray-100 prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:mb-3 prose-p:my-3 prose-p:leading-relaxed prose-p:text-gray-200 prose-strong:text-gray-200 prose-strong:font-bold prose-em:text-gray-200 prose-ul:pl-5 prose-ul:my-3 prose-ol:pl-5 prose-ol:my-3 prose-li:my-1 prose-li:leading-normal prose-li:text-gray-200 prose-a:text-gray-100 prose-a:underline prose-a:font-medium hover:prose-a:text-gray-50 prose-code:bg-gray-800 prose-code:text-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-gray-900 prose-pre:text-white prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-4 prose-pre:overflow-auto prose-pre:code:bg-transparent prose-pre:code:p-0 prose-pre:code:text-sm prose-pre:code:font-mono prose-blockquote:border-l-4 prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:my-4 prose-blockquote:italic prose-blockquote:text-gray-300 prose-hr:my-6 prose-hr:border-gray-700',
                    },
                }}
            />
        </div>
    );
}
