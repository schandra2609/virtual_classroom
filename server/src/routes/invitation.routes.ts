/**
 * @file invitation.routes.ts
 * @module Routes/Classroom/Invitations
 * @description Defines endpoints for users to manage incoming classroom invitations.
 * Parent context: /api/v1/invitations
 * @author Sayan Chandra
 */
import { Router } from "express";
import {
    acceptCoTutorInvitation,
    getMyInvitations,
} from "../controllers/invitation.controller.ts";

/**
 * @constant router
 * @type {Router}
 * @description Router instance for handling invitations to join classrooms as a co-tutor.
 */
const router: Router = Router();

/**
 * @description Retrieves list of pending invitations for the logged-in user.
 * @access Private (TUTOR only via root.routes.ts)
 */
router
    .route("/")
    /** @route GET /api/v1/invitations */
    .get(getMyInvitations as any);

/**
 * @description Accepts a specific invitation and grants classroom access.
 * @access Private (TUTOR only via root.routes.ts)
 */
router
    .route("/:invitationId/accept")
    /** @route POST /api/v1/invitations/:invitationId/accept */
    .post(acceptCoTutorInvitation as any);

export default router;
