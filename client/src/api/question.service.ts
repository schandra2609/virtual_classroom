import { API } from "@/api/API";
import type { ApiResponse, AddQuestionData } from "@/api/types";

export const questionService = {
    /** @route POST /api/v1/classrooms/:classroomId/papers/:paperId/questions */
    addQuestion: async (classroomId: string, paperId: string, data: AddQuestionData): Promise<ApiResponse<any>> => {
        const response = await API.post(`/classrooms/${classroomId}/papers/${paperId}/questions`, data);
        return response.data;
    },

    /** @route PATCH /api/v1/classrooms/:classroomId/papers/:paperId/questions/:questionId */
    updateQuestion: async (classroomId: string, paperId: string, questionId: string, data: Partial<AddQuestionData>): Promise<ApiResponse<any>> => {
        const response = await API.patch(`/classrooms/${classroomId}/papers/${paperId}/questions/${questionId}`, data);
        return response.data;
    },

    /** @route DELETE /api/v1/classrooms/:classroomId/papers/:paperId/questions/:questionId */
    deleteQuestion: async (classroomId: string, paperId: string, questionId: string): Promise<ApiResponse<null>> => {
        const response = await API.delete(`/classrooms/${classroomId}/papers/${paperId}/questions/${questionId}`);
        return response.data;
    },

    /** @route POST /api/v1/classrooms/:classroomId/papers/:paperId/questions/generate */
    generateQuestion: async (classroomId: string, paperId: string, payload: any): Promise<ApiResponse<any>> => {
        const response = await API.post(`/classrooms/${classroomId}/papers/${paperId}/questions/generate`, payload);
        return response.data;
    }
};