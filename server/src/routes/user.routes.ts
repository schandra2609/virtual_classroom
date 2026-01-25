/**
 * @file user.routes.ts
 * @module Routes/User
 * @description Endpoint definitions for current user profile management. 
 * Parent context: /api/v1/users/me
 */
import { Router } from "express";
import { authorize } from "../middlewares/auth.middleware.ts";
import * as userController from "../controllers/user.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";

/**
 * @constant router
 * @type {Router}
 * @description Router instance for handling user-scoped private resources.
 */
const router: Router = Router();

/**
 * @description Fetch or update basic profile data.
 * @access Private
 */
router.route("/")
    /** @route GET /api/v1/users/me */
    .get(userController.getCurrentUser as any)
    /** @route PATCH /api/v1/users/me */
    .patch(userController.updateCurrentUser as any);

/**
 * @description Logic for authenticated password rotation.
 * @access Private
 */
router.route("/change-password")
    /** @route PATCH /api/v1/users/me/change-password */
    .patch(userController.changePassword as any);

/**
 * @description Triggers the 2FA/Email verification process.
 * @access Private
 */
router.route("/send-verification-otp")
    /** @route POST /api/v1/users/me/send-verification-otp */
    .post(userController.sendVerificationOtp as any);

/**
 * @description Submits the OTP to complete email verification.
 * @access Private
 */
router.route("/verify-email")
    /** @route POST /api/v1/users/me/verify-email */
    .post(userController.verifyEmail as any);

/**
 * @description Multipart endpoint to update user avatar.
 * @access Private (Multipart/Form-Data)
 */
router.route("/profile-photo")
    /** @route PATCH /api/v1/users/me/profile-photo */
    .patch(upload.single("image"), userController.uploadProfilePhoto as any);

/**
 * @description Multipart endpoint for tutors to submit verification documents.
 * @access Private (TUTOR only)
 */
router.route("/submit-qualifications")
    /** @route POST /api/v1/users/me/submit-qualifications */
    .post(authorize("TUTOR") as any, upload.single("document"), userController.uploadQualificationProof as any);

export default router;