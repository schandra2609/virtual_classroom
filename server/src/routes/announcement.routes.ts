/**
 * @file announcement.routes.ts
 * @module Routes/Classroom/Announcements
 * @description Defines the endpoints for classroom announcements.
 * Handles the nesting of comments and integrates multipart file upload support.
 * Parent Context: /api/v1/classrooms/:classroomId/announcements
 * @author Sayan Chandra
 */
import { Router } from "express";
import commentRouter from "./comment.routes.ts";
import { isClassroomTutor } from "../middlewares/auth.middleware.ts";
import * as announcementController from "../controllers/announcement.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";

/**
 * @constant router
 * @type {Router}
 * @description Router instance with 'mergeParams' enabled to inherit ':classroomId' from parent.
 */
const router: Router = Router({ mergeParams: true });

/**
 * @section Core Discovery & Creation
 * @url /api/v1/classrooms/:classroomId/announcements
 * @access Private (Classroom Members)
 */
router
    .route("/")
    /**
     * @route GET /api/v1/classrooms/:classroomId/announcements
     * @description Retrieve all announcements for the classroom feed.
     */
    .get(announcementController.getAnnouncements as any)
    /**
     * @route POST /api/v1/classrooms/:classroomId/announcements
     * @description Create a new announcement. Restricted to classroom staff.
     * Integrates Multer to handle up to 5 concurrent file attachments.
     */
    .post(
        isClassroomTutor as any,
        upload.array("attachments", 5),
        announcementController.createAnnouncement as any,
    );

/**
 * @section Announcement Management
 * @url /api/v1/classrooms/:classroomId/announcements/:announcementId
 */
router
    .route("/:announcementId")
    /**
     * @route DELETE /api/v1/classrooms/:classroomId/announcements/:announcementId
     * @description Permanently removes an announcement and its storage assets.
     */
    .delete(
        isClassroomTutor as any,
        announcementController.deleteAnnouncement as any,
    );

/**
 * @section Sub-Resource Nesting
 * Mounts the comment router for granular discussion tracking per announcement.
 * @access Private (Classroom Members)
 */
router.use("/:announcementId/comments", commentRouter);

export default router;