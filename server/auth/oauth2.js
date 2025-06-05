import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';

// Helper function to initialize OAuth2Strategy with environment variable settings
function initializeOAuth2Strategy() {
    const ssoEnabled = process.env.SECRET_SSO_ENABLED === 'true';
    const authorizationURL = process.env.SECRET_SSO_AUTHORIZATION_URL;
    const tokenURL = process.env.SECRET_SSO_TOKEN_URL;
    const clientID = process.env.SECRET_SSO_CLIENT_ID;
    const clientSecret = process.env.SECRET_SSO_CLIENT_SECRET;
    const userInfoURL = process.env.SECRET_SSO_USER_INFO_URL; // Optional: for fetching user profile
    const callbackURL = `${process.env.PUBLIC_URL || 'http://localhost:8080'}/auth/oauth2/callback`;

    if (ssoEnabled && authorizationURL && tokenURL && clientID && clientSecret) {
        console.log('SSO is enabled. Initializing OAuth2 strategy...');
        return new OAuth2Strategy({
            authorizationURL,
            tokenURL,
            clientID,
            clientSecret,
            callbackURL,
            scope: ['openid', 'profile', 'email'], // Standard scopes, adjust if needed by your provider
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            // The 'profile' object from passport-oauth2 is often minimal or empty.
            // User details are typically fetched from the UserInfo endpoint if one is provided.
            let userProfileDetails = {
                id: profile.id, // This might be undefined
                displayName: profile.displayName, // This might be undefined
                emails: profile.emails, // This might be undefined
                provider: 'oauth2',
            };

            if (userInfoURL) {
                try {
                    // Use 'node-fetch' or 'axios' to make the request to userInfoURL
                    // For example, using node-fetch (ensure it's installed: npm install node-fetch)
                    // import fetch from 'node-fetch'; // Add this at the top of the file
                    // const response = await fetch(userInfoURL, {
                    //     headers: { 'Authorization': `Bearer ${accessToken}` }
                    // });
                    // if (!response.ok) {
                    //     throw new Error(`Failed to fetch user info: ${response.statusText}`);
                    // }
                    // const fetchedProfile = await response.json();

                    // --- Placeholder for actual fetch ---
                    // Simulate fetching profile data for now, as direct fetch isn't shown in original
                    // Replace this with actual fetch logic.
                    // Example:
                    // const fetchedProfile = { // This structure depends on your provider
                    //    sub: 'unique_user_id_from_provider', // OpenID Connect standard ID field
                    //    name: 'John Doe',
                    //    email: 'john.doe@example.com'
                    // };
                    // console.log("Fetched user profile from UserInfo URL:", fetchedProfile);
                    // --- End Placeholder ---

                    // For now, we'll just log and use the limited profile or a placeholder
                    // You'll need to map fields from your actual userInfoURL response to userProfileDetails
                    console.log('Access Token (for UserInfo):', accessToken ? ' vorhanden' : 'nicht vorhanden');
                    console.log('Profile from provider (before UserInfo fetch):', profile);

                    // If using a real fetch, you'd update userProfileDetails here:
                    // userProfileDetails.id = fetchedProfile.sub || userProfileDetails.id || accessToken.slice(0,10);
                    // userProfileDetails.displayName = fetchedProfile.name || userProfileDetails.displayName || 'SSO User';
                    // userProfileDetails.emails = fetchedProfile.email ? [{ value: fetchedProfile.email }] : userProfileDetails.emails || [];

                    // Using placeholder values if primary ones are missing after potential fetch
                    userProfileDetails.id = userProfileDetails.id || accessToken.slice(0,10); // Fallback ID
                    userProfileDetails.displayName = userProfileDetails.displayName || 'SSO User';
                    userProfileDetails.emails = userProfileDetails.emails || [];


                } catch (err) {
                    console.error("Error fetching user profile from UserInfo URL:", err);
                    return done(err);
                }
            } else {
                 // If no UserInfo URL, use whatever profile info was returned (likely minimal)
                 // or generate placeholders.
                userProfileDetails.id = userProfileDetails.id || accessToken.slice(0,10); // Fallback ID
                userProfileDetails.displayName = userProfileDetails.displayName || 'SSO User';
                userProfileDetails.emails = userProfileDetails.emails || [];
            }

            return done(null, userProfileDetails);
        });
    } else {
        if (!ssoEnabled) {
            console.log('SSO is disabled via SECRET_SSO_ENABLED=false.');
        } else {
            console.warn(
                'SSO is enabled but one or more required environment variables are missing. ' +
                'Required: SECRET_SSO_AUTHORIZATION_URL, SECRET_SSO_TOKEN_URL, SECRET_SSO_CLIENT_ID, SECRET_SSO_CLIENT_SECRET.'
            );
        }
        return null; // Strategy cannot be initialized
    }
}

// Initialize and configure passport
// This is now synchronous as it reads from process.env
const strategy = initializeOAuth2Strategy();
if (strategy) {
    passport.use('oauth2', strategy);
    console.log('OAuth2 strategy registered with Passport.');
} else {
    console.log('OAuth2 strategy not registered as it could not be initialized.');
}

// No more updateOAuth2Strategy function, as env var changes require restart.

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

export default passport;
