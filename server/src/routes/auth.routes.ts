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
 * @route POST /api/v1/auth/register
 * @description Handles new user registration.
 */
router.route("/register")
    .post(authController.register);

/**
 * @route POST /api/v1/auth/login
 * @description Handles credential-based login.
 */
router.route("/login")
    .post(authController.login);

/**
 * @route POST /api/v1/auth/logout
 * @description Handles session termination.
 */
router.route("/logout")
    .post(verifyToken as any, authController.logout as any);
    
/**
 * @route POST /api/v1/auth/refresh-token
 * @description Handles regeneration of new access tokens and rotation of existing refresh token.
 */
router.route("/refresh-token")
    .post(authController.refreshAccessTokens);

/**
 * @route GET /api/v1/auth/google
 * @descripton Initiates the Google OAuth 2.0 flow.
 */
router.route("/google")
    .get(passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false
    }));

/** 
 * @route GET /api/v1/auth/google/callback
 * @description Google-invoked callback. Dispatches to controller for token generation.
 */
router.route("/google/callback")
    .get(passport.authenticate("google", {
        session: false,
        failureRedirect: "/login"
    }), authController.handleGoogleCallback as any);

/**
 * @route POST /api/v1/auth/complete-profile
 * @description Final step for new OAuth users.
 */
router.route("/complete-profile")
    .post(authController.completeUserProfile);

export default router;