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
 * Mounted at: /
 */
router
    .route("/")
    /**
     * @route GET /
     * @description Fetch all comments for the specific announcement.
     */
    .get(commentController.getCommentsForAnnouncement as any)
    /**
     * @route POST /
     * @description Post a new comment to the announcement.
     */
    .post(commentController.createComment as any);

/**
 * @section Individual Comment Management
 * Mounted at: /:commentId
 */
router
    .route("/:commentId")
    /**
     * @route PATCH /:commentId
     * @description Update text of a specific comment. Access: Author only.
     */
    .patch(commentController.updateComment as any)
    /**
     * @route DELETE /:commentId
     * @description Permanently remove a comment. Access: Author or Classroom Staff.
     */
    .delete(commentController.deleteComment as any);

export default router;
