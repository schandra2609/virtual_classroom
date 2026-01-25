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
 * @route GET /api/v1/admin/tutors
 * @description Fetch tutor applications by status.
 * @query {string} status - Filter: PENDING, VERIFIED, or REJECTED.
 */
router.route("/tutors")
    .get(adminController.getTutorApplications as any);

/**
 * @route PATCH /api/v1/admin/tutors/:tutorId/approve
 * @description Approve a specific tutor application.
 */
router.route("/tutors/:tutorId/approve")
    .patch(adminController.approveTutor as any);

/**
 * @route PATCH /api/v1/admin/tutors/:tutorId/reject
 * @description Reject a specific tutor application.
 */
router.route("/tutors/:tutorId/reject")
    .patch(adminController.rejectTutor as any);

export default router;