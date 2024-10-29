import QRCode from 'react-qr-code';

const QRLink = ({ value }) => (
    <div className="flex justify-center">
        <div className="w-64 h-64 p-4 bg-white rounded-lg shadow-lg">
            <QRCode
                value={value}
                size={256}
                className="w-full h-auto"
                viewBox="0 0 256 256"
                style={{ maxWidth: '100%' }}
            />
        </div>
    </div>
);

export default QRLink;
