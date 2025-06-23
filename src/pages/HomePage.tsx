import React from 'react';
import { Header } from '../components/Header';
import { SecretForm } from '../components/SecretForm';
import { Footer } from '../components/Footer';

export function HomePage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <SecretForm />
      </main>
      <Footer />
    </>
  );
}