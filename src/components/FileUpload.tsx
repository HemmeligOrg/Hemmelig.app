import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Lock, File as FileIcon, X, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';
import { useHemmeligStore } from '../store/hemmeligStore';

export function FileUpload({ onFileChange, compact = false }: { onFileChange: (files: File[]) => void; compact?: boolean }) {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const { settings: instanceSettings } = useHemmeligStore();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const maxFileSizeInBytes = instanceSettings.maxSecretSize * 1024; // Convert KB to bytes

  const onDropRejected = useCallback((fileRejections: { file: File; errors: { code: string }[] }[]) => {
    const rejection = fileRejections[0];
    if (rejection?.errors.some(e => e.code === 'file-too-large')) {
      const fileSizeMB = (rejection.file.size / 1024 / 1024).toFixed(2);
      const maxSizeMB = (instanceSettings.maxSecretSize / 1024).toFixed(2);
      setFileError(t('file_upload.file_too_large', { 
        fileName: rejection.file.name, 
        fileSize: fileSizeMB,
        maxSize: maxSizeMB 
      }));
    }
  }, [instanceSettings.maxSecretSize, t]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFileError(null); // Clear previous errors
    const currentTotalSize = files.reduce((sum, file) => sum + file.size, 0);
    const newFilesTotalSize = acceptedFiles.reduce((sum, file) => sum + file.size, 0);

    if (currentTotalSize + newFilesTotalSize > maxFileSizeInBytes) {
      const maxSizeMB = (instanceSettings.maxSecretSize / 1024).toFixed(2);
      setFileError(t('file_upload.max_size_exceeded', { maxSize: maxSizeMB }));
      return;
    }

    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);
    onFileChange(newFiles);
  }, [files, onFileChange, maxFileSizeInBytes, instanceSettings.maxSecretSize, t]);
		
		const removeFile = (fileToRemove: File) => {
    const newFiles = files.filter(file => file !== fileToRemove);
    setFiles(newFiles);
    onFileChange(newFiles);
  };
		
		const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxSize: maxFileSizeInBytes, // Enforce max size per file as well
  });

  if (!user) {
    return (
      <div className={`border-2 border-dashed border-gray-300 dark:border-dark-500/50 ${compact ? 'px-4 py-2.5' : 'p-4'} text-center bg-gray-50 dark:bg-dark-700/20 hover:border-teal-500/50 transition-all duration-300 group`}>
        <div className="flex items-center justify-center space-x-3">
          <div className={`${compact ? 'p-1.5' : 'p-2'} bg-gray-200 dark:bg-dark-600/50 group-hover:bg-teal-500/20 transition-all duration-300`}>
            <Lock className="w-4 h-4 text-gray-500 dark:text-slate-400 group-hover:text-teal-400 transition-colors duration-300" />
          </div>
          <span className="text-gray-500 dark:text-slate-400 text-sm group-hover:text-gray-600 dark:text-slate-300 transition-colors duration-300">
            {t('file_upload.sign_in_to_upload')}
          </span>
          <button className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg">
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
        className={`border-2 border-dashed ${compact ? 'px-4 py-2.5' : 'p-4'} text-center transition-all duration-300 group ${isDragActive ? 'border-teal-500/80 bg-dark-700/40' : 'border-gray-300 dark:border-dark-500/50 bg-gray-50 dark:bg-dark-700/20 hover:border-teal-500/50'}`}
      >
        <input {...getInputProps()} />
        <div className={`flex ${compact ? 'flex-row space-x-3' : 'flex-col space-y-2'} items-center justify-center`}>
          <UploadCloud className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-gray-500 dark:text-slate-400 group-hover:text-teal-400 transition-colors duration-300`} />
          {isDragActive ? (
            <p className="text-gray-600 dark:text-slate-300 text-sm">{t('file_upload.drop_files_here')}</p>
          ) : (
            <p className="text-gray-500 dark:text-slate-400 text-sm group-hover:text-gray-600 dark:text-slate-300 transition-colors duration-300">
              {t('file_upload.drag_and_drop')}
            </p>
          )}
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-dark-700/50 p-2">
              <div className="flex items-center space-x-2">
                <FileIcon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                <span className="text-sm text-gray-600 dark:text-slate-300">{file.name}</span>
              </div>
              <button onClick={() => removeFile(file)} className="p-1 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {fileError && <p className="text-red-500 text-xs mt-2">{fileError}</p>}
    </div>
  );
}


