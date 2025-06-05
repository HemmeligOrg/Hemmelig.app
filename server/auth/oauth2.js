import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import prisma from '../services/prisma.js'; // Import prisma

// Helper function to initialize OAuth2Strategy with dynamic settings
async function initializeOAuth2Strategy() {
    try {
        const settings = await prisma.settings.findFirst({
            where: { id: 'admin_settings' },
        });

        if (settings && settings.sso_enabled && settings.sso_authorization_url && settings.sso_token_url && settings.sso_client_id && settings.sso_client_secret) {
            return new OAuth2Strategy({
                authorizationURL: settings.sso_authorization_url,
                tokenURL: settings.sso_token_url,
                clientID: settings.sso_client_id,
                clientSecret: settings.sso_client_secret,
                callbackURL: `${process.env.PUBLIC_URL || 'http://localhost:8080'}/auth/oauth2/callback`, // Construct callback dynamically
                scope: ['openid', 'profile', 'email'], // Standard scopes, adjust if needed
                passReqToCallback: true, // Allows passing request to the verify callback
            },
            async (req, accessToken, refreshToken, profile, done) => {
                // If your provider supports OpenID Connect and returns profile in id_token,
                // you might need to parse it or use a dedicated OIDC strategy.
                // For generic OAuth2, the profile is often fetched separately.
                // This basic example assumes profile might be partially available or needs fetching.

                // If user info URL is provided, fetch user profile
                if (settings.sso_user_info_url) {
                    try {
                        // The OAuth2Strategy doesn't have a built-in userProfile method like some other strategies.
                        // We need to use the accessToken to fetch the user profile from the sso_user_info_url.
                        // This often requires an HTTP client like 'axios' or 'node-fetch'.
                        // For simplicity, this part is pseudo-coded.
                        // You would typically make a GET request to settings.sso_user_info_url
                        // with `Authorization: Bearer ${accessToken}` header.

                        // const userProfileResponse = await fetch(settings.sso_user_info_url, {
                        //   headers: { Authorization: `Bearer ${accessToken}` }
                        // });
                        // const userProfile = await userProfileResponse.json();
                        // console.log("Fetched user profile:", userProfile);
                        // For now, we'll use the potentially empty profile from passport-oauth2
                        // and rely on information possibly decoded from an ID token if available
                        // or whatever the specific provider sends back directly.
                        // If your provider sends profile info in a non-standard way, this function is where you'd adapt.
                        console.log('Profile from provider (might be limited):', profile);
                         // The `profile` object from passport-oauth2 is often empty or minimal.
                        // It's more of a placeholder. Real user info usually comes from a separate user info endpoint.
                        // For this example, we'll construct a basic profile object.
                        // You'll need to map fields from your actual user info endpoint response.
                        const extractedProfile = {
                            id: profile.id || accessToken.slice(0,10), // Placeholder if no ID in profile
                            displayName: profile.displayName || 'SSO User',
                            emails: profile.emails || [],
                            // provider: 'oauth2' // This is set in authentication.js
                        };
                        return done(null, extractedProfile);
                    } catch (err) {
                        console.error("Error fetching user profile:", err);
                        return done(err);
                    }
                } else {
                     // If no user info URL, proceed with whatever profile info was returned (likely minimal)
                    const extractedProfile = {
                        id: profile.id || accessToken.slice(0,10), // Placeholder
                        displayName: profile.displayName || 'SSO User',
                        emails: profile.emails || [],
                    };
                    return done(null, extractedProfile);
                }
            });
        }
    } catch (error) {
        console.error('Failed to initialize OAuth2 strategy:', error);
    }
    return null; // Return null if strategy cannot be initialized
}


// Initialize and configure passport
// We need to handle the async nature of initializeOAuth2Strategy
// One way is to re-initialize it before each authentication request or on startup if settings don't change often.
// For simplicity in this example, we'll rely on it being called when passport is used.
// A more robust solution might involve a middleware that ensures strategy is current.

let strategy;
initializeOAuth2Strategy().then(s => {
    if (s) {
        strategy = s;
        passport.use('oauth2', strategy);
    }
}).catch(err => console.error("Error setting up initial OAuth2 strategy:", err));


// Function to update the strategy if settings change
export async function updateOAuth2Strategy() {
    console.log("Attempting to update OAuth2 strategy with new settings...");
    const newStrategy = await initializeOAuth2Strategy();
    if (newStrategy) {
        // Passport allows replacing a strategy by using the same name
        passport.unuse('oauth2'); // Remove the old strategy if it exists
        passport.use('oauth2', newStrategy);
        strategy = newStrategy; // Update our reference
        console.log('OAuth2 strategy updated successfully.');
    } else {
        console.warn('OAuth2 strategy could not be updated (likely SSO not configured/enabled).');
        passport.unuse('oauth2'); // Ensure no outdated strategy is lingering
    }
}
// Call updateOAuth2Strategy when admin settings are updated.
// This requires a mechanism to trigger this function from settings.js,
// possibly via an event emitter or by directly calling it after settings are saved.
// For now, this function is exported and can be called.


passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

export default passport;
