import { IconCheck, IconFileOff, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';

import { burnSecret } from '../../api/secret';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

dayjs.extend(relativeTime);

const updateSecretList = (secrets, form, action = 'update') => {
    return secrets.reduce((acc, current) => {
        if (action === 'update' && current.id === form.values.id) {
            acc.push(form.values);
        } else if (action === 'delete' && current.id === form.values.id) {
            // Skip
        } else {
            acc.push(current);
        }
        return acc;
    }, []);
};

const Secrets = () => {
    const [secrets, setSecrets] = useState(useLoaderData());
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    if (secrets.error || [401, 500].includes(secrets.statusCode)) {
        return (
            <div className="space-y-4">
                <ErrorBox message={secrets.error ? secrets.error : t('not_logged_in')} />
            </div>
        );
    }

    const onDeleteSecret = async (secret) => {
        try {
            const burnedSecret = await burnSecret(secret.id);

            if (burnedSecret.error) {
                setError(burnedSecret.error ? burnedSecret.error : t('something_went_wrong'));
                return;
            }

            setSecrets(updateSecretList(secrets, { values: secret }, 'delete'));
            setError(null);
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

    const openDeleteModal = (secret) => {
        setSuccess(false);
        if (window.confirm(t('account.secrets.do_you_want_delete'))) {
            onDeleteSecret(secret);
        }
    };

    const getTime = (expiresAt) => {
        return dayjs().to(dayjs(expiresAt));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {error && <ErrorBox message={error} />}
            {success && <SuccessBox message={'secrets.deleted'} />}

            <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700 text-left">
                            <th className="px-6 py-4 font-medium text-gray-300">
                                {t('account.secrets.id')}
                            </th>
                            <th className="px-6 py-4 font-medium text-gray-300">
                                {t('account.secrets.expires')}
                            </th>
                            <th className="px-6 py-4 font-medium text-gray-300">
                                {t('account.secrets.public')}
                            </th>
                            <th className="px-6 py-4 font-medium text-gray-300">
                                {t('account.secrets.delete')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {secrets.map((secret) => (
                            <tr key={secret.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 text-gray-200">
                                    {secret.isPublic ? secret.title : secret.id}
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    {getTime(secret.expiresAt)}
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                                                    ${
                                                        secret.isPublic
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-gray-600/50 text-gray-400'
                                                    }`}
                                    >
                                        {secret.isPublic && <IconCheck size={12} />}
                                        {secret.isPublic
                                            ? t('account.secrets.yes')
                                            : t('account.secrets.no')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => openDeleteModal(secret)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 
                                                 rounded-md transition-colors"
                                    >
                                        <IconTrash size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {secrets.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                    <div className="flex items-center justify-center gap-2">
                                        <IconFileOff size={18} />
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Secrets;
