import React from 'react';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function FileUpload() {
    const { t } = useTranslation();
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
