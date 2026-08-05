import { API } from "@/api/API";
import type { ApiResponse } from "@/api/types";

export const memberService = {
    /**
     * @route GET /api/v1/classrooms/:classroomId/members
     */
    getClassroomMembers: async (classroomId: string, status?: 'APPROVED' | 'PENDING' | 'REJECTED') => {
        const response = await API.get(`/classrooms/${classroomId}/members${status ? `?status=${status}` : ''}`);
        return response.data;
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/members/:memberId
     */
    removeMember: async (classroomId: string, memberId: string) => {
        const response = await API.delete(`/classrooms/${classroomId}/members/${memberId}`);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/members/:studentId/approve
     */
    approveStudent: async (classroomId: string, studentId: string): Promise<ApiResponse<null>> => {
        const response = await API.patch(`/classrooms/${classroomId}/members/${studentId}/approve`);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/members/:studentId/payment
     * @description Updates the fee-validity period using duration in months
     */
    updateStudentPayment: async (classroomId: string, studentId: string, durationInMonths: number) => {
        const response = await API.patch(`/classrooms/${classroomId}/members/${studentId}/payment`, { durationInMonths });
        return response.data;
    },

    /**
     * @route GET /api/v1/classrooms/:classroomId/members/:studentId/performance
     * @description Fetches the performance data for the Recharts line plot
     */
    getStudentPerformance: async (classroomId: string, studentId: string): Promise<ApiResponse<any[]>> => {
        const response = await API.get(`/classrooms/${classroomId}/members/${studentId}/performance`);
        return response.data;
    }
};