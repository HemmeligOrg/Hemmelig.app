import { ImportantAlert } from '../components/ImportantAlert';
import { SecretForm } from '../components/SecretForm';
import { SecretSettings } from '../components/SecretSettings';
import { useSecretStore } from '../store/secretStore';

export function HomePage() {
    const { secretId } = useSecretStore();

    return (
        <div className="py-6 sm:py-8">
            <ImportantAlert />
            {!secretId && <SecretForm />}
            {secretId && <SecretSettings />}
        </div>
    );
}
