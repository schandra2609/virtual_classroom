import { API } from "@/api/API";
import type { ApiResponse, QuestionPaper, CreatePaperData } from "@/api/types";

export const qpaperService = {
    /** @route GET /api/v1/classrooms/:classroomId/papers */
    getAllQuestionPapers: async (classroomId: string): Promise<ApiResponse<QuestionPaper[]>> => {
        const response = await API.get(`/classrooms/${classroomId}/papers`);
        return response.data;
    },

    /** @route POST /api/v1/classrooms/:classroomId/papers */
    createQuestionPaper: async (classroomId: string, data: CreatePaperData): Promise<ApiResponse<QuestionPaper>> => {
        const response = await API.post(`/classrooms/${classroomId}/papers`, data);
        return response.data;
    },

    /** @route GET /api/v1/classrooms/:classroomId/papers/:paperId */
    getQuestionPaperById: async (classroomId: string, paperId: string): Promise<ApiResponse<QuestionPaper>> => {
        const response = await API.get(`/classrooms/${classroomId}/papers/${paperId}`);
        return response.data;
    },

    /** @route PATCH /api/v1/classrooms/:classroomId/papers/:paperId */
    updateQuestionPaper: async (classroomId: string, paperId: string, data: Partial<CreatePaperData>): Promise<ApiResponse<QuestionPaper>> => {
        const response = await API.patch(`/classrooms/${classroomId}/papers/${paperId}`, data);
        return response.data;
    },

    /** @route DELETE /api/v1/classrooms/:classroomId/papers/:paperId */
    deleteQuestionPaper: async (classroomId: string, paperId: string): Promise<ApiResponse<null>> => {
        const response = await API.delete(`/classrooms/${classroomId}/papers/${paperId}`);
        return response.data;
    },

    /** @route GET /api/v1/classrooms/:classroomId/papers/:paperId/timer */
    getTimerSync: async (classroomId: string, paperId: string): Promise<ApiResponse<{ remainingSeconds: number }>> => {
        const response = await API.get(`/classrooms/${classroomId}/papers/${paperId}/timer`);
        return response.data;
    },

    /** @route PATCH /api/v1/classrooms/:classroomId/papers/:paperId/status */
    changePaperStatus: async (classroomId: string, paperId: string, status: QuestionPaper['status']): Promise<ApiResponse<QuestionPaper>> => {
        const response = await API.patch(`/classrooms/${classroomId}/papers/${paperId}/status`, { status });
        return response.data;
    }
};