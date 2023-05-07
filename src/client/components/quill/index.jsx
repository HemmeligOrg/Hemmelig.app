import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';

const modules = {
    toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['link', 'image'],
    ],
};

const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
];

export default function Quill(props) {
    return (
        <ReactQuill
            theme="bubble"
            modules={modules}
            formats={formats}
            preserveWhitespace
            style={{
                color: '#C1C2C5',
                backgroundColor: '#25262b',
                border: '0.0625rem solid #373A40',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                zIndex: 1000,
                minHeight: props.secretId ? '5rem' : '13rem',
            }}
            {...props}
        />
    );
}
