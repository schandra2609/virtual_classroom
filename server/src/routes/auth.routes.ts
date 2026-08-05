/**
 * @file auth.routes.ts
 * @module Routes/Authentication
 * @description Routes for user identity management.
 * Supports standard credentials (email/password), JWT lifecycle (refresh/logout),
 * and social authentication via Google OAuth 2.0.
 */
import { Router } from "express";
import * as authController from "../controllers/auth.controller.ts";
import { verifyToken } from "../middlewares/auth.middleware.ts";
import passport from "passport";

/**
 * @constant router
 * @type {Router}
 * @description Auth router mounted at the versioned authentication path (e.g., /api/v1/auth).
 */
const router: Router = Router();

/**
 * @url /api/v1/auth/register
 */
router
    .route("/register")
    /**
     * @route POST /api/v1/auth/register
     * @description Handles new user registration.
     */
    .post(authController.register);

/**
 * @url /api/v1/auth/login
 */
router
    .route("/login")
    /**
     * @route POST /api/v1/auth/login
     * @description Handles credential-based login.
     */
    .post(authController.login);

/**
 * @url /api/v1/auth/logout
 */
router
    .route("/logout")
    /**
     * @route POST /api/v1/auth/logout
     * @description Handles session termination.
     */
    .post(verifyToken as any, authController.logout as any);

/**
 * @url /api/v1/auth/refresh-token
 */
router
    .route("/refresh-token")
    /**
     * @route POST /api/v1/auth/refresh-token
     * @description Handles regeneration of new access tokens and rotation of existing refresh token.
     */
    .post(authController.refreshAccessTokens);

/**
 * @url /api/v1/auth/google
 */
router.route("/google").get(
    /**
     * @route GET /api/v1/auth/google
     * @description Initiates the Google OAuth 2.0 flow.
     */
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    }),
);

/**
 * @url /api/v1/auth/google/callback
 */
router.route("/google/callback").get(
    /**
     * @route GET /api/v1/auth/google/callback
     * @description Google-invoked callback. Dispatches to controller for token generation.
     */
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/login",
    }),
    authController.handleGoogleCallback as any,
);

/**
 * @url /api/v1/auth/complete-profile
 */
router
    .route("/complete-profile")
    /**
     * @route POST /api/v1/auth/complete-profile
     * @description Final step for new OAuth users.
     */
    .post(authController.completeUserProfile);

export default router;