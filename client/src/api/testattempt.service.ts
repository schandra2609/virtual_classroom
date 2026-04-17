import { API } from "@/api/API";
import type { ApiResponse, Answer, TestAttempt } from "@/api/types";

export const testattemptService = {
    /** @route GET /api/v1/classrooms/:classroomId/papers/:paperId/attempts */
    getMyAttemptsForPaper: async (classroomId: string, paperId: string): Promise<ApiResponse<TestAttempt[]>> => {
        const response = await API.get(`/classrooms/${classroomId}/papers/${paperId}/attempts`);
        return response.data;
    },

    /** * @route POST /api/v1/classrooms/:classroomId/papers/:paperId/attempts 
     * @description Starts an attempt. Backend automatically calculates if it's OFFICIAL or PRACTICE.
     */
    startTestAttempt: async (classroomId: string, paperId: string): Promise<ApiResponse<TestAttempt>> => {
        const response = await API.post(`/classrooms/${classroomId}/papers/${paperId}/attempts`);
        return response.data;
    },

    /** @route POST /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/answers */
    submitAnswer: async (classroomId: string, paperId: string, attemptId: string, data: Partial<Answer>): Promise<ApiResponse<Answer>> => {
        const response = await API.post(`/classrooms/${classroomId}/papers/${paperId}/attempts/${attemptId}/answers`, data);
        return response.data;
    },

    /** @route POST /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/submit */
    submitTestAttempt: async (classroomId: string, paperId: string, attemptId: string): Promise<ApiResponse<TestAttempt>> => {
        const response = await API.post(`/classrooms/${classroomId}/papers/${paperId}/attempts/${attemptId}/submit`);
        return response.data;
    },

    /** @route GET /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/review */
    getAttemptReview: async (classroomId: string, paperId: string, attemptId: string): Promise<ApiResponse<any>> => {
        const response = await API.get(`/classrooms/${classroomId}/papers/${paperId}/attempts/${attemptId}/review`);
        return response.data;
    },

    /** * @route POST /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/pause 
     * @description Locks the individual student's attempt due to a security violation.
     */
    pauseAttempt: async (classroomId: string, paperId: string, attemptId: string): Promise<ApiResponse<any>> => {
        const response = await API.post(`/classrooms/${classroomId}/papers/${paperId}/attempts/${attemptId}/pause`);
        return response.data;
    }
};