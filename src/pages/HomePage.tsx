import { ImportantAlert } from '../components/ImportantAlert';
import { SecretForm } from '../components/SecretForm';
import { SecretSettings } from '../components/SecretSettings';
import { useSecretStore } from '../store/secretStore';

export function HomePage() {
    const { secretId } = useSecretStore();

    return (
        <div className="mt-4">
            <ImportantAlert />
            {!secretId && <SecretForm />}
            {secretId && <SecretSettings />}
        </div>
    );
}
