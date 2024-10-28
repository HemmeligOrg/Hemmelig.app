import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Quill = ({ value, onChange, readOnly, defaultValue }) => {
    // Define modules based on readOnly state
    const modules = readOnly
        ? {
              toolbar: false, // Disable toolbar in read-only mode
          }
        : {
              toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link', 'code-block'],
                  ['clean'],
              ],
          };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-md overflow-hidden">
            <ReactQuill
                value={value || ''}
                onChange={onChange}
                readOnly={readOnly}
                placeholder={defaultValue}
                theme={readOnly ? 'bubble' : 'snow'}
                modules={modules}
                className="bg-gray-800 text-gray-100 placeholder-gray-500"
            />
        </div>
    );
};

export default Quill;
