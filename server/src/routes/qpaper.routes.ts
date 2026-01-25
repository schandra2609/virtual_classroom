/**
 * @file qpaper.routes.ts
 * @module Routes/Classroom/Examinations
 * @description Routing table for Question Paper entities. 
 * Orchestrates the hierarchy between papers, their individual questions, and student attempts.
 * **Parent Context**: /api/v1/classrooms/:classroomId/papers
 * @author Sayan Chandra
 */
import { Router } from "express";
import questionRouter from "./question.routes.ts";
import testAttemptRouter from "./testattempt.routes.ts";
import * as qpaperController from "../controllers/qpaper.controller.ts";
import { isClassroomTutor } from "../middlewares/auth.middleware.ts";

/**
 * @constant router
 * @type {Router}
 * @description Router instance with 'mergeParams' enabled for deep nesting support.
 */
const router: Router = Router({ mergeParams: true });

/**
 * @section Collective Paper Management
 * URL: /
 */
router.route("/")
    /** 
     * @route GET / 
     * @description Fetch all papers. Applied filters ensure students only see live papers.
     */
    .get(qpaperController.getAllQuestionPapers as any)
    /** 
     * @route POST / 
     * @description Create a new draft/scheduled paper. Access: Tutor only.
     */
    .post(isClassroomTutor as any, qpaperController.createQuestionPaper as any);

/**
 * @section Specific Paper Management
 * URL: /:paperId
 */
router.route("/:paperId")
    /** 
     * @route GET /:paperId 
     * @description Fetch full paper structure. Automatically sanitizes answers for students.
     */
    .get(qpaperController.getQuestionPaperById as any)
    /** 
     * @route PATCH /:paperId 
     * @description Update paper settings (Title, Schedule, Duration). Access: Tutor only.
     */
    .patch(isClassroomTutor as any, qpaperController.updateQuestionPaper as any)
    /** 
     * @route DELETE /:paperId 
     * @description Permanently remove the paper and related records. Access: Tutor only.
     */
    .delete(isClassroomTutor as any, qpaperController.deleteQuestionPaper as any);

/**
 * @section Sub-Resource Mounting
 */

/** 
 * @route /api/v1/classrooms/:classroomId/papers/:paperId/questions 
 * @description Granular management of questions within this paper.
 */
router.use("/:paperId/questions", isClassroomTutor as any, questionRouter);

/** 
 * @route /api/v1/classrooms/:classroomId/papers/:paperId/attempts 
 * @description Logic for students taking the test and reviewing results.
 */
router.use("/:paperId/attempts", testAttemptRouter);

export default router;