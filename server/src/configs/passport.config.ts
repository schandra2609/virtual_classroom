import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Profile, VerifyCallback } from "passport-google-oauth20";
import type { PassportStatic } from "passport";
import { ENV_CONFIG } from "./env.config.ts";

export const configureGoogleStrategy = (passport: PassportStatic): void => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: ENV_CONFIG.GOOGLE_OAUTH.CLIENT_ID,
                clientSecret: ENV_CONFIG.GOOGLE_OAUTH.CLIENT_SECRET,
                callbackURL: `${ENV_CONFIG.API_V}/auth/google/callback`,
            },
            (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
                return done(null, profile);
            }
        )
    );
};