import { Header } from '../components/Header';
import { SecretForm } from '../components/SecretForm';
import { Footer } from '../components/Footer';
import { SecretSettings } from '../components/SecretSettings';
import { useSecretStore } from '../store/secretStore';

export function HomePage() {
    const { secretId } = useSecretStore();
    return (
        <>
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {!secretId && <SecretForm />}
                {secretId && <SecretSettings />}
            </main>
            <Footer />
        </>
    );
}
