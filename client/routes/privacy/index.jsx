import { useTranslation } from 'react-i18next';

const Privacy = () => {
    const { t } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-white">{t('privacy.title')}</h1>

                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">Is my data secure?</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Yes, your data is secure. Hemmelig is encrypting every message with
                            TweetNACL before saving it to our database. The salt used is both a
                            master key defined by the server, and a user key that is generated for
                            each secret which is not saved to the database. The same is valid for
                            password generation. The only difference is that the password is using
                            the bcrypt algorithm.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">Do you track me?</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We use privacy-focused analytics to understand how Hemmelig is being
                            used. Our analytics system is designed with privacy in mind:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-300">
                            <li>
                                We use HMAC-based hashing to create anonymous visitor IDs - your
                                actual IP address is never stored
                            </li>
                            <li>We only track page visits and basic usage patterns</li>
                            <li>Bot traffic is automatically filtered out</li>
                            <li>No personal information or secret content is ever tracked</li>
                            <li>Analytics can be disabled completely via configuration</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed">
                            This minimal tracking helps us improve the service while maintaining
                            your privacy. All analytics data is aggregated and non-identifiable.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">
                            I still don't trust this application.
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            If that is being the case, Hemmelig offers a docker image to self-host
                            the application.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">Data Collection</h2>
                        <p className="text-gray-300 leading-relaxed">
                            We only collect the minimum amount of data necessary to provide our
                            service. This includes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-300">
                            <li>The encrypted content of your secrets</li>
                            <li>Expiration times for secrets</li>
                            <li>Basic usage statistics (non-personal)</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">Contact Information</h2>
                        <p className="text-gray-300 leading-relaxed">
                            If you have any questions about our privacy practices or this policy,
                            please feel free to contact us through our GitHub repository.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
