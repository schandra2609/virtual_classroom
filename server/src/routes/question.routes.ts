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
 * @url /api/v1/classrooms/:classroomId/papers/:paperId/questions
 * @access Restricted: Classroom Tutor (verified in parent router)
 */
router
    .route("/")
    /**
     * @route POST /api/v1/classrooms/:classroomId/papers/:paperId/questions
     * @description Add a new question (MCQ/MSQ/NAT) to the paper.
     */
    .post(questionController.addQuestion as any);

/**
 * @section AI Integration
 * @url /api/v1/classrooms/:classroomId/papers/:paperId/questions/generate
 * @access Restricted: Classroom Tutor
 */
router
    .route("/generate")
    /**
     * @route POST /api/v1/classrooms/:classroomId/papers/:paperId/questions/generate
     * @description Automatically generates questions via Gemini based on MinIO materials.
     */
    .post(questionController.generateAIQuestions as any);

/**
 * @section Individual Question Management
 * @url /api/v1/classrooms/:classroomId/papers/:paperId/questions/:questionId
 * @access Restricted: Classroom Tutor
 */
router
    .route("/:questionId")
    /**
     * @route PATCH /api/v1/classrooms/:classroomId/papers/:paperId/questions/:questionId
     * @description Update question text or marks.
     */
    .patch(questionController.updateQuestion as any)
    /**
     * @route DELETE /api/v1/classrooms/:classroomId/papers/:paperId/questions/:questionId
     * @description Remove the question from the paper.
     */
    .delete(questionController.deleteQuestion as any);

export default router;