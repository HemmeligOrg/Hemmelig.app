import { useTranslation } from 'react-i18next';

const TermsAndCondition = () => {
    const { t } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-white">{t('terms.title')}</h1>

                <div className="space-y-6">
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">AGREEMENT TO TERMS</h2>
                        <p className="text-gray-300 leading-relaxed">
                            These Terms of Use constitute a legally binding agreement made between
                            you, whether personally or on behalf of an entity ("you") and Hemmelig
                            Org ("Company," "we," "us," or "our"), concerning your access to and use
                            of the https://hemmelig.app website as well as any other media form,
                            media channel, mobile website or mobile application related, linked, or
                            otherwise connected thereto (collectively, the "Site").
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">USER REGISTRATION</h2>
                        <p className="text-gray-300 leading-relaxed">
                            You may be required to register with the Site. You agree to keep your
                            password confidential and will be responsible for all use of your
                            account and password. We reserve the right to remove, reclaim, or change
                            a username you select if we determine, in our sole discretion, that such
                            username is inappropriate, obscene, or otherwise objectionable.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">PROHIBITED ACTIVITIES</h2>
                        <div className="text-gray-300 leading-relaxed">
                            <p className="mb-4">
                                You may not access or use the Site for any purpose other than that
                                for which we make the Site available. The Site may not be used in
                                connection with any commercial endeavors except those that are
                                specifically endorsed or approved by us. As a user of the Site, you
                                agree not to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>
                                    Systematically retrieve data or other content from the Site to
                                    create or compile, directly or indirectly, a collection,
                                    compilation, database, or directory without written permission
                                    from us.
                                </li>
                                <li>
                                    Trick, defraud, or mislead us and other users, especially in any
                                    attempt to learn sensitive account information such as user
                                    passwords.
                                </li>
                                <li>
                                    Circumvent, disable, or otherwise interfere with
                                    security-related features of the Site, including features that
                                    prevent or restrict the use or copying of any Content or enforce
                                    limitations on the use of the Site and/or the Content contained
                                    therein.
                                </li>
                                <li>
                                    Disparage, tarnish, or otherwise harm, in our opinion, us and/or
                                    the Site.
                                </li>
                                <li>
                                    Use any information obtained from the Site in order to harass,
                                    abuse, or harm another person.
                                </li>
                                <li>
                                    Make improper use of our support services or submit false
                                    reports of abuse or misconduct.
                                </li>
                                <li>
                                    Use the Site in a manner inconsistent with any applicable laws
                                    or regulations.
                                </li>
                                <li>Engage in unauthorized framing of or linking to the Site.</li>
                                <li>
                                    Upload or transmit (or attempt to upload or to transmit)
                                    viruses, Trojan horses, or other material, including excessive
                                    use of capital letters and spamming (continuous posting of
                                    repetitive text), that interferes with any party’s uninterrupted
                                    use and enjoyment of the Site or modifies, impairs, disrupts,
                                    alters, or interferes with the use, features, functions,
                                    operation, or maintenance of the Site.
                                </li>
                                <li>
                                    Engage in any automated use of the system, such as using scripts
                                    to send comments or messages, or using any data mining, robots,
                                    or similar data gathering and extraction tools.
                                </li>
                                <li>
                                    Delete the copyright or other proprietary rights notice from any
                                    Content.
                                </li>
                                <li>
                                    Attempt to impersonate another user or person or use the
                                    username of another user.
                                </li>
                                <li>
                                    Upload or transmit (or attempt to upload or to transmit) any
                                    material that acts as a passive or active information collection
                                    or transmission mechanism, including without limitation, clear
                                    graphics interchange formats (“gifs”), 1×1 pixels, web bugs,
                                    cookies, or other similar devices (sometimes referred to as
                                    “spyware” or “passive collection mechanisms” or “pcms”).
                                </li>
                                <li>
                                    Interfere with, disrupt, or create an undue burden on the Site
                                    or the networks or services connected to the Site.
                                </li>
                                <li>
                                    Harass, annoy, intimidate, or threaten any of our employees or
                                    agents engaged in providing any portion of the Site to you.
                                </li>
                                <li>
                                    Attempt to bypass any measures of the Site designed to prevent
                                    or restrict access to the Site, or any portion of the Site.
                                </li>
                                <li>
                                    Copy or adapt the Site’s software, including but not limited to
                                    Flash, PHP, HTML, JavaScript, or other code.
                                </li>
                                <li>
                                    Except as permitted by applicable law, decipher, decompile,
                                    disassemble, or reverse engineer any of the software comprising
                                    or in any way making up a part of the Site.
                                </li>
                                <li>
                                    Except as may be the result of standard search engine or
                                    Internet browser usage, use, launch, develop, or distribute any
                                    automated system, including without limitation, any spider,
                                    robot, cheat utility, scraper, or offline reader that accesses
                                    the Site, or using or launching any unauthorized script or other
                                    software.
                                </li>
                                <li>
                                    Use a buying agent or purchasing agent to make purchases on the
                                    Site.
                                </li>
                                <li>
                                    Make any unauthorized use of the Site, including collecting
                                    usernames and/or email addresses of users by electronic or other
                                    means for the purpose of sending unsolicited email, or creating
                                    user accounts by automated means or under false pretenses.
                                </li>
                                <li>
                                    Use the Site as part of any effort to compete with us or
                                    otherwise use the Site and/or the Content for any
                                    revenue-generating endeavor or commercial enterprise.
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">TERM AND TERMINATION</h2>
                        <p className="text-gray-300 leading-relaxed">
                            These Terms of Use shall remain in full force and effect while you use
                            the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF USE, WE
                            RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR
                            LIABILITY, DENY ACCESS TO AND USE OF THE SITE (INCLUDING BLOCKING
                            CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">DISCLAIMER</h2>
                        <p className="text-gray-300 leading-relaxed">
                            THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT
                            YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">
                            LIMITATIONS OF LIABILITY
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO
                            YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL,
                            EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">INDEMNIFICATION</h2>
                        <p className="text-gray-300 leading-relaxed">
                            You agree to defend, indemnify, and hold us harmless, including our
                            subsidiaries, affiliates, and all of our respective officers, agents,
                            partners, and employees, from and against any loss, damage, liability,
                            claim, or demand.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsAndCondition;
