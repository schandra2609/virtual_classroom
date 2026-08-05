/**
 * @file invitation.routes.ts
 * @module Routes/Classroom/Invitations
 * @description Defines endpoints for users to manage incoming classroom invitations.
 * Parent context: /api/v1/invitations
 * @author Sayan Chandra
 */
import { Router } from "express";
import { acceptCoTutorInvitation, getMyInvitations } from "../controllers/invitation.controller.ts";

/**
 * @constant router
 * @type {Router}
 * @description Router instance for handling invitations to join classrooms as a co-tutor.
 */
const router: Router = Router();

/**
 * @access Private (TUTOR only via root.routes.ts)
 * @url /api/v1/invitations
 */
router
    .route("/")
    /** 
     * @route GET /api/v1/invitations 
     * @description Retrieves list of pending invitations for the logged-in user
     */
    .get(getMyInvitations as any);

/**
 * @access Private (TUTOR only via root.routes.ts)
 * @url /api/v1/invitations/:invitationId/accept
 */
router
    .route("/:invitationId/accept")
    /** 
     * @route POST /api/v1/invitations/:invitationId/accept 
     * @description Accepts a specific invitation and grants classroom access.
     */
    .post(acceptCoTutorInvitation as any);

export default router;