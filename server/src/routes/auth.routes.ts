import { Router } from "express";
import { completeUserProfile, handleGoogleCallback, login, logout, refreshAccessTokens, register } from "../controllers/auth.controller.ts";
import { verifyToken } from "../middlewares/auth.middleware.ts";
import passport from "passport";

const router = Router();

router.route("/register")
    .post(register);

router.route("/login")
    .post(login);

router.route("/logout")
    .post(verifyToken as any, logout as any);

router.route("/refresh-token")
    .post(refreshAccessTokens);

router.route("/google")
    .get(passport.authenticate("google", {
        scope: ['profile', 'email'],
        session: false
    }));

router.route("/google/callback")
    .get(passport.authenticate("google", {
        session: false,
        failureRedirect: "/login"
    }), handleGoogleCallback as any);

router.route("/complete-profile")
    .post(completeUserProfile);


export default router;