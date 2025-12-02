export function PrivacyPage() {
  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Privacy</h1>

        <div className="space-y-8 text-gray-700 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Is my data secure?
            </h2>
            <p className="mb-4">
              Yes, your data is secure. Hemmelig uses client-side encryption with{' '}
              <strong>AES-256-GCM</strong>, a modern authenticated encryption algorithm, powered by
              the Web Crypto API. All encryption and decryption happens entirely in your browser.
              Your plaintext secret never leaves your device.
            </p>
            <p className="mb-4">Here's how it works:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>
                A unique 32-character encryption key is generated for each secret (or you can
                provide your own password)
              </li>
              <li>
                A unique salt is generated per secret and used with <strong>PBKDF2</strong> (100,000
                iterations, SHA-256) to derive a 256-bit AES key
              </li>
              <li>
                A random 96-bit IV (initialization vector) is generated for each encryption
                operation
              </li>
              <li>
                The encrypted data (IV + ciphertext) is stored on the server — the decryption key is
                only in the URL fragment (after the #) and is never sent to the server
              </li>
            </ul>
            <p>
              This means even if our database were compromised, your secrets remain encrypted and
              unreadable without the decryption key that only you possess.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Do you track me?
            </h2>
            <p className="mb-4">
              We use privacy-focused analytics to understand how Hemmelig is being used. Our
              analytics system is designed with privacy in mind:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                We use HMAC-based hashing to create anonymous visitor IDs - your actual IP address
                is never stored
              </li>
              <li>We only track page visits and basic usage patterns</li>
              <li>Bot traffic is automatically filtered out</li>
              <li>No personal information or secret content is ever tracked</li>
              <li>Analytics can be disabled completely via configuration</li>
            </ul>
            <p className="mt-4">
              This minimal tracking helps us improve the service while maintaining your privacy. All
              analytics data is aggregated and non-identifiable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              I still don't trust this application.
            </h2>
            <p>
              If that is being the case, Hemmelig offers a docker image to self-host the
              application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Data Collection
            </h2>
            <p className="mb-4">
              We only collect the minimum amount of data necessary to provide our service. This
              includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The encrypted content of your secrets</li>
              <li>Expiration times for secrets</li>
              <li>Basic usage statistics (non-personal)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Contact Information
            </h2>
            <p>
              If you have any questions about our privacy practices or this policy, please feel free
              to contact us through our{' '}
              <a
                href="https://github.com/HemmeligOrg/Hemmelig.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 underline"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
