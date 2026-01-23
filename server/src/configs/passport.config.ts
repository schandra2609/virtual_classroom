/**
 * @file passport.config.ts
 * @module Config/AuthStrategies
 * @description Defines authentication strategies for Passport.js.
 * Primarily handles the Google OAuth 2.0 flow for student and tutor social login.
 */
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Profile, VerifyCallback } from "passport-google-oauth20";
import type { PassportStatic } from "passport";
import { ENV_CONFIG } from "./env.config.ts";

/**
 * @function configureGoogleStrategy
 * @description Registers the Google OAuth strategy with Passport.
 * Defines the client credentials and the callback URL.
 * @param {PassportStatic} passport - The Passport instance to configure.
 * @example
 * // In app.ts
 * configureGoogleStrategy(passport);
 */
export const configureGoogleStrategy = (passport: PassportStatic): void => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: ENV_CONFIG.GOOGLE_OAUTH.CLIENT_ID,
                clientSecret: ENV_CONFIG.GOOGLE_OAUTH.CLIENT_SECRET,
                callbackURL: `${ENV_CONFIG.API_V}/auth/google/callback`,
            },
            /**
             * @callback strategyCallback
             * @param _accessToken - OAuth access token (unused)
             * @param _refreshToken - OAuth refresh token (unused)
             * @param profile - The user profile returned by Google
             * @param done - Signal authentication completion
             */
            (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
                return done(null, profile);
            }
        )
    );
};