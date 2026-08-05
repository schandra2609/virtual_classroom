/**
 * @file admin.routes.ts
 * @module Routes/Administration
 * @description Defines protected endpoints for system administrators.
 * Orchestrates the tutor onboarding workflow.
 * @access Restricted: AccountType.ADMINISTRATOR
 * @author Sayan Chandra
 */
import { Router } from "express";
import * as adminController from "../controllers/admin.controller.ts";

/**
 * @constant router
 * @type {Router}
 * @description Administrative router instance.
 */
const router: Router = Router();

/**
 * @section Tutor Application Management
 * @url /api/v1/admin/tutors
 * @access Admin only
 */
router
    .route("/tutors")
    /**
     * @route /api/v1/admin/tutors
     * @description Fetch tutor applications by status.
     */
    .get(adminController.getTutorApplications as any);

/**
 * @url /api/v1/admin/tutors/:tutorId/approve
 */
router
    .route("/tutors/:tutorId/approve")
    /** 
     * @route PATCH /api/v1/admin/tutors/:tutorId/approve 
     * @description Approve a specific tutor application.
     */
    .patch(adminController.approveTutor as any);

/**
 * @url /api/v1/admin/tutors/:tutorId/reject
 */
router
    .route("/tutors/:tutorId/reject")
    /** 
     * @route PATCH /api/v1/admin/tutors/:tutorId/reject 
     * @description Reject a specific tutor application.
     */
    .patch(adminController.rejectTutor as any);

export default router;