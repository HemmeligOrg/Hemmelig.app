import { IconKey } from '@tabler/icons';
import { generate } from 'generate-password-browser';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// https://github.com/zenoamaro/react-quill/issues/836#issuecomment-2440290893
class ReactQuillFixed extends ReactQuill {
    destroyEditor() {
        super.destroyEditor();
        delete this.editor;
    }
}

// Custom button component for password generation
const PasswordButton = ({ onClick, tooltip }) => (
    <button
        type="button"
        className="ql-customButton p-1 hover:bg-gray-700 rounded-md transition-colors"
        onClick={onClick}
        title={tooltip}
    >
        <IconKey size={18} className="text-gray-400" />
    </button>
);

const Quill = ({ value, onChange, readOnly, defaultValue }) => {
    const quillRef = useRef(null);
    const { t } = useTranslation();

    // Custom handler for password generation
    const handlePasswordGeneration = () => {
        if (!quillRef.current) return;

        const editor = quillRef.current.getEditor();
        if (!editor) return;

        const password = generate({
            length: 16,
            numbers: true,
            symbols: true,
            uppercase: true,
            lowercase: true,
        });
        const range = editor.getSelection(true);
        editor.insertText(range.index, password + '\n');
    };

    // Define modules based on readOnly state
    const modules = readOnly
        ? {
              toolbar: false, // Disable toolbar in read-only mode
          }
        : {
              toolbar: {
                  container: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'code-block'],
                      ['clean'],
                      // Custom button container
                      [{ 'custom-button': 'password' }],
                  ],
                  handlers: {
                      'custom-button': handlePasswordGeneration,
                  },
              },
          };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-md overflow-hidden">
            <div className="relative">
                <ReactQuillFixed
                    ref={quillRef}
                    value={value || ''}
                    onChange={onChange}
                    readOnly={readOnly}
                    placeholder={defaultValue}
                    theme={readOnly ? 'bubble' : 'snow'}
                    modules={modules}
                    className="bg-gray-800 text-gray-100 placeholder-gray-500 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-base [&_.ql-editor]:font-sans [&_.ql-editor]:leading-relaxed
                    [&_.ql-toolbar]:border-gray-700 [&_.ql-toolbar]:bg-gray-900
                    [&_.ql-container]:border-gray-700
                    [&_.ql-editor_h1]:text-3xl [&_.ql-editor_h1]:font-bold [&_.ql-editor_h1]:mb-4
                    [&_.ql-editor_h2]:text-2xl [&_.ql-editor_h2]:font-bold [&_.ql-editor_h2]:mb-3
                    [&_.ql-editor_h3]:text-xl [&_.ql-editor_h3]:font-bold [&_.ql-editor_h3]:mb-2
                    [&_.ql-editor_p]:mb-4
                    [&_.ql-editor_ul]:list-disc [&_.ql-editor_ul]:ml-4
                    [&_.ql-editor_ol]:list-decimal [&_.ql-editor_ol]:ml-4
                    [&_.ql-snow_.ql-toolbar_button]:text-gray-300
                    [&_.ql-snow_.ql-toolbar_button:hover]:text-white
                    [&_.ql-snow_.ql-toolbar_button.ql-active]:text-blue-400"
                />
                {!readOnly && (
                    <div className="absolute top-0 right-0 transform -translate-x-1/2 h-[42px] flex items-center">
                        <div className="w-[1px] h-5 bg-gray-700 mx-4"></div>
                        <PasswordButton
                            onClick={handlePasswordGeneration}
                            tooltip={t('home.inject_password')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Quill;
