/**
 * @file classroom.routes.ts
 * @module Routes/Classroom
 * @description Definitive routing for Classroom entities. Handles nesting
 * for sub-resources like announcements, assignments, and examinations.
 * @author Sayan Chandra
 */
import { Router } from "express";
import announcementRouter from "./announcement.routes.ts";
import assignmentRouter from "./assignment.routes.ts";
import memberRouter from "./member.routes.ts";
import qPaperRouter from "./qpaper.routes.ts";
import {
    authorize,
    isClassroomTutor,
    isCreator,
    isMember,
} from "../middlewares/auth.middleware.ts";
import * as classroomController from "../controllers/classroom.controller.ts";

/**
 * @constant router
 * @type {Router}
 * @description Router instance for handling classroom related requests.
 */
const router: Router = Router();

/**
 * @section Core Discovery & Creation
 */
router
    .route("/")
    /** @route GET /api/v1/classrooms - Fetch classrooms for logged-in user */
    .get(classroomController.getMyClassrooms as any)
    /** @route POST /api/v1/classrooms - Initialize a new classroom (Tutors only) */
    .post(
        authorize("TUTOR") as any,
        classroomController.createClassroom as any,
    );

/** @section Students join via code */
router
    .route("/join")
    /** @route POST /api/v1/classrooms/join */
    .post(
        authorize("STUDENT") as any,
        classroomController.joinClassroom as any,
    );

/**
 * @section Specific Classroom Management
 */
router
    .route("/:classroomId")
    /** @route GET /:id - Detailed view (Staff/Approved Students) */
    .get(isMember as any, classroomController.getClassroomById as any)
    /** @route PATCH /:id - Metadata update (Creator only) */
    .patch(isCreator as any, classroomController.updateClassroom as any)
    /** @route DELETE /:id - Permanent removal (Creator only) */
    .delete(isCreator as any, classroomController.deleteClassroom as any);

/** @section Handles classroom leave requests */
router
    .route("/:classroomId/leave")
    /** @route DELETE :id/leave */
    .delete(isMember as any, classroomController.leaveClassroom as any);

/**
 * @section Issue staff invitation (Creator only)
 */
router
    .route("/:classroomId/invite-tutor")
    /** @route POST /:id/invite-tutor */
    .post(isCreator as any, classroomController.inviteCoTutor as any);

/**
 * @section Regenerate joining code (Creator only)
 */
router
    .route("/:classroomId/refresh-code")
    /** @route PATCH /:id/refresh-code */
    .patch(isCreator as any, classroomController.refreshJoiningCode as any);

/**
 * @section Change classroom owner (Creator only)
 */
router
    .route("/:classroomId/transfer-ownership")
    /** @route PATCH /:id/transfer-ownership */
    .patch(isCreator as any, classroomController.transferOwnership as any);

/**
 * @section Nested Sub-Resources
 * Implementing 'mergeParams' in children ensures context inheritance.
 */

/** @route /api/v1/classrooms/:classroomId/announcements */
router.use("/:classroomId/announcements", isMember as any, announcementRouter);

/** @route /api/v1/classrooms/:classroomId/assignments */
router.use("/:classroomId/assignments", isMember as any, assignmentRouter);

/** @route /api/v1/classrooms/:classroomId/members */
router.use("/:classroomId/members", isClassroomTutor as any, memberRouter);

/** @route /api/v1/classrooms/:classroomId/papers */
router.use("/:classroomId/papers", isMember as any, qPaperRouter);

export default router;
