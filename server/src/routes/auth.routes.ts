import { Router } from "express";
import * as authController from "../controllers/auth.controller.ts";
import { verifyToken } from "../middlewares/auth.middleware.ts";
import passport from "passport";

const router: Router = Router();

router.route("/register")
    .post(authController.register);

router.route("/login")
    .post(authController.login);

router.route("/logout")
    .post(verifyToken as any, authController.logout as any);

router.route("/refresh-token")
    .post(authController.refreshAccessTokens);

router.route("/google")
    .get(passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false
    }));

router.route("/google/callback")
    .get(passport.authenticate("google", {
        session: false,
        failureRedirect: "/login"
    }), authController.handleGoogleCallback as any);

router.route("/complete-profile")
    .post(authController.completeUserProfile);


export default router;