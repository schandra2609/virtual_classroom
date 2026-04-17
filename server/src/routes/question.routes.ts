/**
 * @file question.routes.ts
 * @module Routes/Classroom/QuestionPapers/Questions
 * @description Defines routing for managing questions within a specific paper.
 * **URL Pattern**: /api/v1/classrooms/:classroomId/papers/:paperId/questions
 * This router utilizes 'mergeParams' to capture both classroom and paper contexts.
 * @author Sayan Chandra
 */
import { Router } from "express";
import * as questionController from "../controllers/question.controller.ts";

/**
 * @constant router
 * @type {Router}
 * @description Router instance with 'mergeParams' enabled to access ':paperId'
 * from the parent Question Paper router.
 */
const router: Router = Router({ mergeParams: true });

/**
 * @section Question Collection Management
 * Mounted at: /
 */
router
    .route("/")
    /**
     * @route POST /
     * @description Add a new question (MCQ/MSQ/NAT) to the paper.
     * @access Restricted: Classroom Tutor (verified in parent router)
     */
    .post(questionController.addQuestion as any);

/**
 * @section Individual Question Management
 * Mounted at: /:questionId
 */
router
    .route("/:questionId")
    /**
     * @route PATCH /:questionId
     * @description Update question text or marks.
     * @access Restricted: Classroom Tutor
     */
    .patch(questionController.updateQuestion as any)

    /**
     * @route DELETE /:questionId
     * @description Remove the question from the paper.
     * @access Restricted: Classroom Tutor
     */
    .delete(questionController.deleteQuestion as any);

export default router;
