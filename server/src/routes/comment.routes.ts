/**
 * @file comment.routes.ts
 * @module Routes/Classroom/Comments
 * @description Defines the sub-routing for comments.
 * **URL Pattern**: /api/v1/classrooms/:classroomId/announcements/:announcementId/comments
 * This router utilizes 'mergeParams' to capture announcement identifiers from the parent stack.
 * @author Sayan Chandra
 */
import { Router } from "express";
import * as commentController from "../controllers/comment.controller.ts";

/**
 * @constant router
 * @type {Router}
 * @description Router instance with 'mergeParams' enabled to access ':announcementId'.
 */
const router: Router = Router({ mergeParams: true });

/**
 * @section Base Discussion Routes
 * @url /api/v1/classrooms/:classroomId/announcements/:announcementId/comments
 */
router
    .route("/")
    /**
     * @route GET /api/v1/classrooms/:classroomId/announcements/:announcementId/comments
     * @description Fetch all comments for the specific announcement.
     */
    .get(commentController.getCommentsForAnnouncement as any)
    /**
     * @route POST /api/v1/classrooms/:classroomId/announcements/:announcementId/comments
     * @description Post a new comment to the announcement.
     */
    .post(commentController.createComment as any);

/**
 * @section Individual Comment Management
 * @url /api/v1/classrooms/:classroomId/announcements/:announcementId/comments/:commentId
 */
router
    .route("/:commentId")
    /**
     * @route PATCH /api/v1/classrooms/:classroomId/announcements/:announcementId/comments/:commentId
     * @description Update text of a specific comment. Access: Author only.
     */
    .patch(commentController.updateComment as any)
    /**
     * @route DELETE /api/v1/classrooms/:classroomId/announcements/:announcementId/comments/:commentId
     * @description Permanently remove a comment. Access: Author or Classroom Staff.
     */
    .delete(commentController.deleteComment as any);

export default router;