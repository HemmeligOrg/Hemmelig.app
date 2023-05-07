// This is where the modification of the html has to be done
export default `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>Hemmelig.app - paste a password, secret message or private information.</title>

        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <link rel="manifest" href="/manifest.json" />
        <!-- Primary Meta Tags -->
        <meta name="title" content="Paste a password, secret message or private information." />
        <meta
            name="description"
            content="Keep your sensitive information out of chat logs, emails, and more with encrypted secrets."
        />

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.hemmelig.app/" />
        <meta
            property="og:title"
            content="Paste a password, secret message or private information."
        />
        <meta
            property="og:description"
            content="Keep your sensitive information out of chat logs, emails, and more with heavily
                    encrypted secrets."
        />
        <meta property="og:image" content="/icons/icon-512x512.png" />

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.hemmelig.app/" />
        <meta
            property="twitter:title"
            content="Paste a password, secret message or private information."
        />
        <meta
            property="twitter:description"
            content="Keep your sensitive information out of chat logs, emails, and more with heavily
                    encrypted secrets."
        />
        <meta property="twitter:image" content="/icons/icon-512x512.png" />

        <meta name="theme-color" content="#231e23" />

        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/maskable-icon-192x192.png" />
        <script>
            try {
                window.__SECRET_CONFIG = {{config}}
            } catch (e) {
                window.__SECRET_CONFIG = '';
            }
            
        </script>
    </head>
    <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>

        <script type="module" src="/src/index.jsx"></script>
    </body>
</html>
`;
