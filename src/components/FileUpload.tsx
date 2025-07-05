import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Lock, File as FileIcon, X, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';

export function FileUpload({ onFileChange }: { onFileChange: (files: File[]) => void }) {
    const { t } = useTranslation();
    const { user } = useUserStore();
    const [files, setFiles] = useState<File[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = [...files, ...acceptedFiles];
        setFiles(newFiles);
        onFileChange(newFiles);
    }, [files, onFileChange]);
		
		const removeFile = (fileToRemove: File) => {
        const newFiles = files.filter(file => file !== fileToRemove);
        setFiles(newFiles);
        onFileChange(newFiles);
    };
		
		const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
    });

    if (!user) {
        return (
            <div className="border-2 border-dashed border-slate-600/50 rounded-xl p-6 text-center bg-slate-700/20 hover:border-teal-500/50 transition-all duration-300 group">
                <div className="flex items-center justify-center space-x-3">
                    <div className="p-2 bg-slate-600/50 rounded-lg group-hover:bg-teal-500/20 transition-all duration-300">
                        <Lock className="w-5 h-5 text-slate-400 group-hover:text-teal-400 transition-colors duration-300" />
                    </div>
                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                        {t('file_upload.sign_in_to_upload')}
                    </span>
                    <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        {t('file_upload.sign_in')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 group ${isDragActive ? 'border-teal-500/80 bg-slate-700/40' : 'border-slate-600/50 bg-slate-700/20 hover:border-teal-500/50'}`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-3">
                    <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-teal-400 transition-colors duration-300" />
                    {isDragActive ? (
                        <p className="text-slate-300">{t('file_upload.drop_files_here')}</p>
                    ) : (
                        <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                            {t('file_upload.drag_and_drop')}
                        </p>
                    )}
                </div>
            </div>
            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <FileIcon className="w-5 h-5 text-slate-400" />
                                <span className="text-sm text-slate-300">{file.name}</span>
                            </div>
                            <button onClick={() => removeFile(file)} className="p-1 text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


