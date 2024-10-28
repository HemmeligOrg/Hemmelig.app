import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Quill = ({ value, onChange, readOnly, defaultValue }) => {
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-md overflow-hidden">
            <ReactQuill
                value={value || ''}
                onChange={onChange}
                readOnly={readOnly}
                placeholder={defaultValue}
                theme="snow"
                modules={{
                    toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'code-block'],
                        ['clean'],
                    ],
                }}
                className="bg-gray-800 text-gray-100 placeholder-gray-500"
            />
        </div>
    );
};

export default Quill;
