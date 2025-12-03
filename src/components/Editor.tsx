import {
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
  IconNumber64Small,
  IconQuote,
  IconSourceCode,
  IconStrikethrough,
  IconX,
} from '@tabler/icons-react';
import { Color } from '@tiptap/extension-color';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import { EditorProvider, useCurrentEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { generate } from 'generate-password-browser';
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

// Link Modal Component
interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  initialUrl?: string;
}
const LinkModal: FC<LinkModalProps> = ({ isOpen, onClose, onSubmit, initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Focus the input when the modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">
            {t('editor.link_modal.title')}
          </h3>
          <button onClick={onClose} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">
            <IconX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2"
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
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-700 border border-gray-300 dark:border-dark-500 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-dark-600"
            >
              {t('editor.link_modal.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 text-white "
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
interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}
const PasswordModal: FC<PasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [passwordLength, setPasswordLength] = useState(16);
  const [options, setOptions] = useState<PasswordOptions>({
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
  });
  const [password, setPassword] = useState(generatePassword(16, options));
  const { t } = useTranslation();

  if (!isOpen) return null;

  const regeneratePassword = () => {
    setPassword(generatePassword(passwordLength, options));
  };

  const handleOptionChange = (option: keyof PasswordOptions) => {
    // Prevent disabling all options - at least one must be enabled
    const newOptions = { ...options, [option]: !options[option] };
    if (Object.values(newOptions).some((value) => value)) {
      setOptions(newOptions);
      setPassword(generatePassword(passwordLength, newOptions));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">
            {t('editor.password_modal.title')}
          </h3>
          <button onClick={onClose} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200">
            <IconX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
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
                className="w-full mr-3 accent-teal-500"
              />
              <span className="text-gray-700 dark:text-slate-200 w-8 text-center">{passwordLength}</span>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
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
                  <label htmlFor="numbers" className="text-gray-600 dark:text-slate-300 text-sm">
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
                  <label htmlFor="symbols" className="text-gray-600 dark:text-slate-300 text-sm">
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
                  <label htmlFor="uppercase" className="text-gray-600 dark:text-slate-300 text-sm">
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
                  <label htmlFor="lowercase" className="text-gray-600 dark:text-slate-300 text-sm">
                    {t('editor.password_modal.include_lowercase')}
                  </label>
                </div>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
              {t('editor.password_modal.generated_password')}
            </label>
            <div className="flex">
              <input
                type="text"
                value={password}
                readOnly
                className="w-full px-3 py-2 bg-light-800 dark:bg-dark-900 border border-gray-300 dark:border-dark-500 text-gray-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={regeneratePassword}
                className="px-3 py-2 bg-teal-500 text-white hover:opacity-90"
              >
                {t('editor.password_modal.refresh')}
              </button>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-dark-600"
            >
              {t('editor.password_modal.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 text-white hover:opacity-90"
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
              <IconCopy size={20} stroke={1.5} className="text-gray-600 dark:text-slate-300" />
            </button>
          </Tooltip>
          <Tooltip text={t('editor.tooltips.copy_html')}>
            <button onClick={copyAsHTML} className={buttonClass}>
              <IconSourceCode size={20} className="text-gray-600 dark:text-slate-300" />
            </button>
          </Tooltip>
          <Tooltip text={t('editor.tooltips.copy_base64')}>
            <button onClick={copyAsBase64} className={buttonClass}>
              <IconNumber64Small size={20} stroke={1.5} className="text-gray-600 dark:text-slate-300" />
            </button>
          </Tooltip>
        </div>
      </div>
      {copySuccess && (
        <div className="text-sm text-gray-700 dark:text-slate-200 animate-fade-in-out p-2">{copySuccess}</div>
      )}
    </div>
  );
};

const MenuBar: FC = () => {
  const { editor } = useCurrentEditor();
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  const openLinkModal = useCallback(() => {
    setLinkModalOpen(true);
  }, []);

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
    (password: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(password).run();
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  const buttonClass =
    'p-2 bg-gray-200 dark:bg-dark-600/50 hover:bg-gray-300 dark:hover:bg-dark-500/50 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105 min-w-[44px] touch-manipulation';
  const activeButtonClass =
    'p-2 bg-teal-500 text-white transition-all duration-200 min-w-[44px] touch-manipulation';

  const groupClass = 'flex flex-wrap gap-1 w-full sm:w-auto';

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
                d={menuOpen ? "M19 9l-7 7-7-7" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        <div
          className={`${menuOpen ? 'block' : 'hidden'} sm:block p-3 sm:p-4 bg-gray-50 dark:bg-dark-700/30 border border-gray-200 dark:border-dark-500/30`}
        >
          <div className="flex flex-col justify-center sm:flex-row gap-2 sm:gap-0 sm:flex-wrap">
            <div className={groupClass}>
              <Tooltip text={t('editor.tooltips.bold')}>
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  disabled={!editor.can().chain().focus().toggleBold().run()}
                  className={
                    editor.isActive('bold') ? activeButtonClass : buttonClass
                  }
                >
                  <IconBold size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
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
                  <IconItalic size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
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
                  <IconCode size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
                </button>
              </Tooltip>
              <Tooltip text={t('editor.tooltips.link')}>
                <button
                  onClick={openLinkModal}
                  className={
                    editor.isActive('link') ? activeButtonClass : buttonClass
                  }
                >
                  <IconLink size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
                </button>
              </Tooltip>
              <Tooltip text={t('editor.tooltips.remove_link')}>
                <button
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  disabled={!editor.isActive('link')}
                  className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <IconLinkOff size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
                </button>
              </Tooltip>
              <Tooltip text={t('editor.tooltips.insert_password')}>
                <button
                  onClick={() => setPasswordModalOpen(true)}
                  className={buttonClass}
                >
                  <IconKey size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
                </button>
              </Tooltip>
            </div>

            <div className="hidden sm:block w-px h-8 bg-gray-300 dark:bg-dark-600 mx-2"></div>
            <div className="block sm:hidden w-full h-px bg-gray-300 dark:bg-dark-600 my-1"></div>

            <div className={groupClass}>
              <Tooltip text={t('editor.tooltips.paragraph')}>
                <button
                  onClick={() => editor.chain().focus().setParagraph().run()}
                  className={
                    editor.isActive('paragraph') ? activeButtonClass : buttonClass
                  }
                >
                  <IconLetterP size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
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
                  <IconH1 size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
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
                  <IconH2 size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
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
                  <IconH3 size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
                </button>
              </Tooltip>
            </div>

            <div className="hidden sm:block w-px h-8 bg-gray-300 dark:bg-dark-600 mx-2"></div>
            <div className="block sm:hidden w-full h-px bg-gray-300 dark:bg-dark-600 my-1"></div>

            <div className={groupClass}>
              <Tooltip text={t('editor.tooltips.bullet_list')}>
                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={
                    editor.isActive('bulletList') ? activeButtonClass : buttonClass
                  }
                >
                  <IconList size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
                </button>
              </Tooltip>
              <Tooltip text={t('editor.tooltips.numbered_list')}>
                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={
                    editor.isActive('orderedList') ? activeButtonClass : buttonClass
                  }
                >
                  <IconListNumbers size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
                </button>
              </Tooltip>
              <Tooltip text={t('editor.tooltips.blockquote')}>
                <button
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={
                    editor.isActive('blockquote') ? activeButtonClass : buttonClass
                  }
                >
                  <IconQuote size={18} stroke={1.5} className="text-gray-600 dark:text-slate-300 mx-auto" />
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
                    className="text-gray-600 dark:text-slate-300 mx-auto"
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onSubmit={handleLinkSubmit}
        initialUrl={editor?.getAttributes('link').href || ''}
      />

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
  );
}
