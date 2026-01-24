/**
 * @file passport.config.ts
 * @module Config/AuthStrategies
 * @description This module defines the Passport.js configuration for Google OAuth 2.0.
 * It streamlines the authentication flow by offloading identity verification to Google.
 * @author Sayan Chandra
 */
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Profile, VerifyCallback } from "passport-google-oauth20";
import type { PassportStatic } from "passport";
import { ENV_CONFIG } from "./env.config.ts";

/**
 * @function configureGoogleStrategy
 * @description Initializes the Google OAuth Strategy.
 * Flow:
 * 1. Client hits /auth/google.
 * 2. Passport redirects to Google login.
 * 3. Upon success, Google redirects to the callbackURL with a profile.
 * @param {PassportStatic} passport - The global Passport instance.
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
             * @description The internal callback triggered after a successful Google login.
             * @param {string} _accessToken - OAuth access token.
             * @param {string} _refreshToken - OAuth refresh token.
             * @param {Profile} profile - The user data returned by Google.
             * @param {VerifyCallback} done - Signal Passport to proceed.
             */
            (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
                // At this stage, the profile is passed to the Auth Controller
                return done(null, profile);
            }
        )
    );
};