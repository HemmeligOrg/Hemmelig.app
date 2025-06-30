import React, { useState } from 'react';
import { Header } from '../components/Header';
import { SecretForm } from '../components/SecretForm';
import { Footer } from '../components/Footer';
import { SecretSettings } from '../components/SecretSettings';

export function HomePage() {
    const [secretId, setSecretId] = useState<string | null>(null);
    const [decryptionKey, setDecryptionKey] = useState<string | null>(null);

    const handleSecretCreated = (id: string, key: string) => {
        setSecretId(id);
        setDecryptionKey(key);
    };

    return (
        <>
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {!secretId && <SecretForm onSecretCreated={handleSecretCreated} />}
                {secretId && <SecretSettings secretId={secretId} decryptionKey={decryptionKey} />}
            </main>
            <Footer />
        </>
    );
}
