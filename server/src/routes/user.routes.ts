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
 * @section Profile Management
 * @url /api/v1/users/me
 * @access Private
 */
router
    .route("/")
    /**
     * @route GET /api/v1/users/me
     * @description Fetch or update basic profile data.
     */
    .get(userController.getCurrentUser as any)
    /**
     * @route PATCH /api/v1/users/me
     * @description Update profile data.
     */
    .patch(userController.updateCurrentUser as any)
    /**
     * @route DELETE /api/v1/users/me
     * @description Delete profile.
     */
    .delete(userController.deleteCurrentUser as any);

/**
 * @section OTP Management
 * @url /api/v1/users/me/send-otp
 * @access Private
 */
router
    .route("/send-otp")
    /**
     * @route POST /api/v1/users/me/send-otp
     * @description Universal endpoint to generate and send an OTP.
     */
    .post(userController.sendOtp as any);

/**
 * @section OTP Verification
 * @url /api/v1/users/me/verify-otp
 * @access Private
 */
router
    .route("/verify-otp")
    /**
     * @route POST /api/v1/users/me/verify-otp
     * @description Submits the OTP to complete email verification.
     */
    .post(userController.verifyOtp as any);

/**
 * @section Password Management
 * @url /api/v1/users/me/change-password
 * @access Private
 */
router
    .route("/change-password")
    /**
     * @route PATCH /api/v1/users/me/change-password
     * @description Logic for authenticated password rotation.
     */
    .patch(userController.changePassword as any);

/**
 * @section Avatar Management
 * @url /api/v1/users/me/profile-photo
 * @access Private (Multipart/Form-Data)
 */
router
    .route("/profile-photo")
    /**
     * @route PATCH /api/v1/users/me/profile-photo
     * @description Multipart endpoint to update user avatar.
     */
    .patch(upload.single("image"), userController.uploadProfilePhoto as any);

/**
 * @section Qualification Management
 * @url /api/v1/users/me/submit-qualifications
 * @access Private (TUTOR only)
 */
router
    .route("/submit-qualifications")
    /**
     * @route POST /api/v1/users/me/submit-qualifications
     * @description Multipart endpoint for tutors to submit verification documents.
     */
    .post(
        authorize("TUTOR") as any,
        upload.single("document"),
        userController.uploadQualificationProof as any,
    );

export default router;