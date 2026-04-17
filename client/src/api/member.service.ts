import { API } from "@/api/API";
import type { ApiResponse } from "@/api/types";

export const memberService = {
    /**
     * @route GET /api/v1/classrooms/:classroomId/members
     * @description Fetches all members (or filtered by PENDING/APPROVED status)
     */
    getClassroomMembers: async (classroomId: string, status?: 'APPROVED' | 'PENDING' | 'REJECTED') => {
        const response = await API.get(`/classrooms/${classroomId}/members${status ? `?status=${status}` : ''}`);
        return response.data;
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/members/:memberId
     * @description Expels a member from the classroom
     */
    removeMember: async (classroomId: string, userId: string) => {
        const response = await API.delete(`/classrooms/${classroomId}/members/${userId}`);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/members/:studentId/approve
     * @description Approves a student's pending join request
     */
    approveStudent: async (classroomId: string, studentId: string): Promise<ApiResponse<null>> => {
        const response = await API.patch(`/classrooms/${classroomId}/members/${studentId}/approve`);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/members/:studentId/payment
     * @description Updates the fee-validity period (expiry date) for a student
     */
    updateMembershipStatus: async (classroomId: string, userId: string, status: 'APPROVED' | 'REJECTED') => {
        const response = await API.patch(`/classrooms/${classroomId}/members/${userId}`, { status });
        return response.data;
    }
};