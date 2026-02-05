import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImportantAlert } from '../components/ImportantAlert';
import { SecretForm } from '../components/SecretForm';
import { SecretSettings } from '../components/SecretSettings';
import { useHemmeligStore } from '../store/hemmeligStore';
import { useSecretStore } from '../store/secretStore';
import { useUserStore } from '../store/userStore';

export function HomePage() {
    const { secretId } = useSecretStore();
    const { settings } = useHemmeligStore();
    const user = useUserStore((s) => s.user);
    const navigate = useNavigate();

    useEffect(() => {
        if (settings.requireRegisteredUser && !user) {
            navigate('/login', { replace: true });
        }
    }, [settings.requireRegisteredUser, user, navigate]);

    return (
        <div className="py-6 sm:py-8">
            <ImportantAlert />
            {!secretId && <SecretForm />}
            {secretId && <SecretSettings />}
        </div>
    );
}
