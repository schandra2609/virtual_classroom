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
 * @url /api/v1/classrooms
 */
router
    .route("/")
    /** 
     * @route GET /api/v1/classrooms
     * @description Fetch classrooms for logged-in user
     */
    .get(classroomController.getMyClassrooms as any)
    /**
     * @route POST /api/v1/classrooms
     * @description Initialize a new classroom (Tutors only)
     */
    .post(
        authorize("TUTOR") as any,
        classroomController.createClassroom as any,
    );

/**
 * @section Students join classrooms
 * @url /api/v1/classrooms/join
 */
router
    .route("/join")
    /** 
     * @route POST /api/v1/classrooms/join 
     * @description Students join classrooms
     */
    .post(
        authorize("STUDENT") as any,
        classroomController.joinClassroom as any,
    );

/**
 * @section Specific Classroom Management
 * @url /api/v1/classrooms/:classroomId
 */
router
    .route("/:classroomId")
    /** 
     * @route GET /api/v1/classrooms/:classroomId 
     * @description Detailed view (Staff/Approved Students)
     */
    .get(isMember as any, classroomController.getClassroomById as any)
    /** 
     * @route PATCH /api/v1/classrooms/:classroomId 
     * @description Metadata update (Creator only)
     */
    .patch(isCreator as any, classroomController.updateClassroom as any)
    /** 
     * @route DELETE /api/v1/classrooms/:classroomId 
     * @description Permanent removal (Creator only)
     */
    .delete(isCreator as any, classroomController.deleteClassroom as any);

/** 
 * @section Handles classroom leave requests
 * @url /api/v1/classrooms/:classroomId/leave
 * */
router
    .route("/:classroomId/leave")
    /** 
     * @route DELETE /api/v1/classrooms/:classroomId/leave 
     * @description Handles classroom leave requests
     */
    .delete(isMember as any, classroomController.leaveClassroom as any);

/**
 * @section Issue staff invitation (Creator only)
 * @url /api/v1/classrooms/:classroomId/invite-tutor
 */
router
    .route("/:classroomId/invite-tutor")
    /** 
     * @route POST /api/v1/classrooms/:classroomId/invite-tutor 
     * @description Issue staff invitation (Creator only)
     */
    .post(isCreator as any, classroomController.inviteCoTutor as any);

/**
 * @section Regenerate joining code (Creator only)
 * @url /api/v1/classrooms/:classroomId/refresh-code
 */
router
    .route("/:classroomId/refresh-code")
    /** 
     * @route PATCH /api/v1/classrooms/:classroomId/refresh-code 
     * @description Regenerate joining code (Creator only)
     */
    .patch(isCreator as any, classroomController.refreshJoiningCode as any);

/**
 * @section Change classroom owner (Creator only)
 * @url /api/v1/classrooms/:classroomId/transfer-ownership
 */
router
    .route("/:classroomId/transfer-ownership")
    /** 
     * @route PATCH /api/v1/classrooms/:classroomId/transfer-ownership 
     * @description Change classroom owner (Creator only)
     */
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
router.use("/:classroomId/members", isMember as any, memberRouter);

/** @route /api/v1/classrooms/:classroomId/papers */
router.use("/:classroomId/papers", isMember as any, qPaperRouter);

export default router;