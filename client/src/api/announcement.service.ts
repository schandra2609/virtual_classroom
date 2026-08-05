import { API } from "@/api/API";
import type { ApiResponse, Announcement } from "@/api/types";

export const announcementService = {
    /**
     * @route GET /api/v1/classrooms/:classroomId/announcements
     * @description Retrieve all announcements for the classroom feed.
     */
    getAnnouncements: async (classroomId: string): Promise<ApiResponse<Announcement[]>> => {
        const response = await API.get(`/classrooms/${classroomId}/announcements`);
        return response.data;
    },

    /**
     * @route POST /api/v1/classrooms/:classroomId/announcements
     * @description Create a new announcement (FormData for up to 5 attachments).
     */
    createAnnouncement: async (classroomId: string, formData: FormData): Promise<ApiResponse<Announcement>> => {
        const response = await API.post(
            `/classrooms/${classroomId}/announcements`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data;
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/announcements/:announcementId
     * @description Permanently removes an announcement and its storage assets.
     */
    deleteAnnouncement: async (classroomId: string, announcementId: string): Promise<ApiResponse<null>> => {
        const response = await API.delete(`/classrooms/${classroomId}/announcements/${announcementId}`);
        return response.data;
    }
};