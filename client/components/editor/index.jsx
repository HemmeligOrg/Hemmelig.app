import {
    IconArrowBackUp,
    IconArrowForwardUp,
    IconBold,
    IconBrandCodesandbox,
    IconCode,
    IconH1,
    IconH2,
    IconH3,
    IconItalic,
    IconLetterP,
    IconList,
    IconListNumbers,
    IconQuote,
    IconStrikethrough,
} from '@tabler/icons';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import { EditorProvider, useCurrentEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

// Tooltip component for buttons
const Tooltip = ({ text, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
                {children}
            </div>
            {isVisible && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 dark:bg-gray-700 rounded shadow-sm whitespace-nowrap z-10">
                    {text}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                </div>
            )}
        </div>
    );
};

const MenuBar = () => {
    const { editor } = useCurrentEditor();

    if (!editor) {
        return null;
    }

    // Updated button styles with better dark mode support
    const buttonClass =
        'p-1.5 text-sm rounded-md hover:bg-gray-100 hover:dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors';
    const activeButtonClass =
        'p-1.5 text-sm rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors';

    // Updated group styles for better dark mode appearance
    const groupClass =
        'flex items-center border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm';

    return (
        <div className="mb-4 p-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm">
            <div className="flex flex-wrap gap-2 items-center">
                {/* Text formatting group */}
                <div className={groupClass}>
                    <Tooltip text="Bold">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            disabled={!editor.can().chain().focus().toggleBold().run()}
                            className={editor.isActive('bold') ? activeButtonClass : buttonClass}
                        >
                            <IconBold
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text="Italic">
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            disabled={!editor.can().chain().focus().toggleItalic().run()}
                            className={editor.isActive('italic') ? activeButtonClass : buttonClass}
                        >
                            <IconItalic
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text="Strikethrough">
                        <button
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            disabled={!editor.can().chain().focus().toggleStrike().run()}
                            className={editor.isActive('strike') ? activeButtonClass : buttonClass}
                        >
                            <IconStrikethrough
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text="Inline Code">
                        <button
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            disabled={!editor.can().chain().focus().toggleCode().run()}
                            className={editor.isActive('code') ? activeButtonClass : buttonClass}
                        >
                            <IconCode
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                </div>

                {/* Paragraph formatting group */}
                <div className={groupClass}>
                    <Tooltip text="Paragraph">
                        <button
                            onClick={() => editor.chain().focus().setParagraph().run()}
                            className={
                                editor.isActive('paragraph') ? activeButtonClass : buttonClass
                            }
                        >
                            <IconLetterP
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text="Heading 1">
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={
                                editor.isActive('heading', { level: 1 })
                                    ? activeButtonClass
                                    : buttonClass
                            }
                        >
                            <IconH1
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text="Heading 2">
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={
                                editor.isActive('heading', { level: 2 })
                                    ? activeButtonClass
                                    : buttonClass
                            }
                        >
                            <IconH2
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text="Heading 3">
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={
                                editor.isActive('heading', { level: 3 })
                                    ? activeButtonClass
                                    : buttonClass
                            }
                        >
                            <IconH3
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                </div>

                {/* List formatting group */}
                <div className={groupClass}>
                    <Tooltip text="Bullet List">
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={
                                editor.isActive('bulletList') ? activeButtonClass : buttonClass
                            }
                        >
                            <IconList
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text="Numbered List">
                        <button
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={
                                editor.isActive('orderedList') ? activeButtonClass : buttonClass
                            }
                        >
                            <IconListNumbers
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text="Blockquote">
                        <button
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className={
                                editor.isActive('blockquote') ? activeButtonClass : buttonClass
                            }
                        >
                            <IconQuote
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text="Code Block">
                        <button
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            className={
                                editor.isActive('codeBlock') ? activeButtonClass : buttonClass
                            }
                        >
                            <IconBrandCodesandbox
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                </div>

                {/* History controls */}
                <div className={groupClass}>
                    <Tooltip text="Undo">
                        <button
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().chain().focus().undo().run()}
                            className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            <IconArrowBackUp
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                    <Tooltip text="Redo">
                        <button
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().chain().focus().redo().run()}
                            className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            <IconArrowForwardUp
                                size={18}
                                stroke={1.5}
                                className="text-gray-700 dark:text-gray-300"
                            />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

const extensions = [
    Color.configure({ types: [TextStyle.name, ListItem.name] }),
    TextStyle.configure({ types: [ListItem.name] }),
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

const content = `
<h2>
  Hi there,
</h2>
<p>
  this is a <em>basic</em> example of <strong>Tiptap</strong>. Sure, there are all kind of basic text styles you'd probably expect from a text editor. But wait until you see the lists:
</p>
<ul>
  <li>
    That's a bullet list with one …
  </li>
  <li>
    … or two list items.
  </li>
</ul>
<p>
  Isn't that great? And all of that is editable. But wait, there's more. Let's try a code block:
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  I know, I know, this is impressive. It's only the tip of the iceberg though. Give it a try and click a little bit around. Don't forget to check the other examples too.
</p>
<blockquote>
  Wow, that's amazing. Good work, boy! 👏
  <br />
  — Mom
</blockquote>
`;

export default function Editor({ setContent }) {
    return (
        <div className="prose prose-sm max-w-none">
            <EditorProvider
                slotBefore={<MenuBar />}
                extensions={extensions}
                content={content}
                onUpdate={({ editor }) => {
                    setContent(editor.getHTML());
                }}
                editorProps={{
                    attributes: {
                        class: 'focus:outline-none text-gray-100 prose-headings:mt-6 prose-headings:first:mt-0 prose-headings:text-gray-100 prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:mb-3 prose-p:my-3 prose-p:leading-relaxed prose-p:text-gray-200 prose-ul:pl-5 prose-ul:my-3 prose-ol:pl-5 prose-ol:my-3 prose-li:my-1 prose-li:leading-normal prose-li:text-gray-200 prose-a:text-gray-100 prose-a:underline prose-a:font-medium hover:prose-a:text-gray-50 prose-code:bg-gray-800 prose-code:text-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-gray-900 prose-pre:text-white prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-4 prose-pre:overflow-auto prose-pre:code:bg-transparent prose-pre:code:p-0 prose-pre:code:text-sm prose-pre:code:font-mono prose-blockquote:border-l-4 prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:my-4 prose-blockquote:italic prose-blockquote:text-gray-300 prose-hr:my-6 prose-hr:border-gray-700',
                    },
                }}
            />
        </div>
    );
}
