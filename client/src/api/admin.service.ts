import { API } from "@/api/API";
import type { ApiResponse, TutorApplication } from "@/api/types";

export const adminService = {
    /** * @route GET /api/v1/admin/tutors
     * @description Fetch tutor applications by status (PENDING, VERIFIED, REJECTED).
     */
    getTutorApplications: async (statusFilter?: 'PENDING' | 'VERIFIED' | 'REJECTED'): Promise<ApiResponse<TutorApplication[]>> => {
        const response = await API.get('/admin/tutors', {
            params: statusFilter ? { status: statusFilter } : undefined
        });
        return response.data;
    },

    /** * @route PATCH /api/v1/admin/tutors/:tutorId/approve
     * @description Approve a specific tutor application.
     */
    approveTutor: async (tutorId: string): Promise<ApiResponse<null>> => {
        const response = await API.patch(`/admin/tutors/${tutorId}/approve`);
        return response.data;
    },

    /** * @route PATCH /api/v1/admin/tutors/:tutorId/reject
     * @description Reject a specific tutor application with a reason.
     */
    rejectTutor: async (tutorId: string, reason: string): Promise<ApiResponse<null>> => {
        const response = await API.patch(`/admin/tutors/${tutorId}/reject`, { reason });
        return response.data;
    }
};