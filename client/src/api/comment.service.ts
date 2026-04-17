import { API } from "@/api/API";
import type { ApiResponse, Comment, CreateCommentData } from "@/api/types";

export const commentService = {
    /**
     * @route GET /api/v1/classrooms/:classroomId/announcements/:announcementId/comments
     * @description Fetch all comments for a specific announcement.
     */
    getCommentsForAnnouncement: async (classroomId: string, announcementId: string): Promise<ApiResponse<Comment[]>> => {
        const response = await API.get(`/classrooms/${classroomId}/announcements/${announcementId}/comments`);
        return response.data;
    },

    /**
     * @route POST /api/v1/classrooms/:classroomId/announcements/:announcementId/comments
     * @description Post a new comment to the announcement.
     */
    createComment: async (classroomId: string, announcementId: string, data: CreateCommentData): Promise<ApiResponse<Comment>> => {
        const response = await API.post(`/classrooms/${classroomId}/announcements/${announcementId}/comments`, data);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/announcements/:announcementId/comments/:commentId
     * @description Update text of a specific comment.
     */
    updateComment: async (classroomId: string, announcementId: string, commentId: string, data: CreateCommentData): Promise<ApiResponse<Comment>> => {
        const response = await API.patch(`/classrooms/${classroomId}/announcements/${announcementId}/comments/${commentId}`, data);
        return response.data;
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/announcements/:announcementId/comments/:commentId
     * @description Permanently remove a comment.
     */
    deleteComment: async (classroomId: string, announcementId: string, commentId: string): Promise<ApiResponse<null>> => {
        const response = await API.delete(`/classrooms/${classroomId}/announcements/${announcementId}/comments/${commentId}`);
        return response.data;
    }
};