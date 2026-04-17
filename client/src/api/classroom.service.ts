import { API } from "@/api/API";
import type {
    ApiResponse,
    Classroom,
    CreateClassroomData,
    JoinClassroomData,
    UpdateClassroomData,
    InviteTutorData,
    TransferOwnershipData,
} from "@/api/types";

export const classroomService = {
    /**
     * @route GET /api/v1/classrooms
     * @description Fetch classrooms for the logged-in user
     */
    getMyClassrooms: async (): Promise<ApiResponse<Classroom[]>> => {
        const response = await API.get('/classrooms');
        return response.data;
    },

    /**
     * @route POST /api/v1/classrooms
     * @description Initialize a new classroom (Tutors only)
     */
    createClassroom: async (data: CreateClassroomData): Promise<ApiResponse<Classroom>> => {
        const response = await API.post('/classrooms', data);
        return response.data;
    },

    /**
     * @route POST /api/v1/classrooms/join
     * @description Students join a classroom via joining code
     */
    joinClassroom: async (data: JoinClassroomData): Promise<ApiResponse<null>> => {
        const response = await API.post('/classrooms/join', data);
        return response.data;
    },

    /**
     * @route GET /api/v1/classrooms/:classroomId
     * @description Detailed view of a specific classroom
     */
    getClassroomById: async (classroomId: string): Promise<ApiResponse<Classroom>> => {
        const response = await API.get(`/classrooms/${classroomId}`);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId
     * @description Update classroom metadata (Creator only)
     */
    updateClassroom: async (classroomId: string, data: UpdateClassroomData): Promise<ApiResponse<Classroom>> => {
        const response = await API.patch(`/classrooms/${classroomId}`, data);
        return response.data;
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId
     * @description Permanent removal of a classroom (Creator only)
     */
    deleteClassroom: async (classroomId: string): Promise<ApiResponse<null>> => {
        const response = await API.delete(`/classrooms/${classroomId}`);
        return response.data;
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/leave
     * @description Member leaves the classroom
     */
    leaveClassroom: async (classroomId: string): Promise<ApiResponse<null>> => {
        const response = await API.delete(`/classrooms/${classroomId}/leave`);
        return response.data;
    },

    /**
     * @route POST /api/v1/classrooms/:classroomId/invite-tutor
     * @description Issue staff invitation (Creator only)
     */
    inviteCoTutor: async (classroomId: string, data: InviteTutorData): Promise<ApiResponse<null>> => {
        const response = await API.post(`/classrooms/${classroomId}/invite-tutor`, data);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/refresh-code
     * @description Regenerate joining code (Creator only)
     */
    refreshJoiningCode: async (classroomId: string): Promise<ApiResponse<string>> => {
        const response = await API.patch(`/classrooms/${classroomId}/refresh-code`);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/transfer-ownership
     * @description Change classroom owner (Creator only)
     */
    transferOwnership: async (classroomId: string, data: TransferOwnershipData): Promise<ApiResponse<null>> => {
        const response = await API.patch(`/classrooms/${classroomId}/transfer-ownership`, data);
        return response.data;
    },

    /**
     * @route GET /api/v1/classrooms/:classroomId/students/:studentId/performance
     * @description Fetches the performance data for the Recharts line plot
     */
    getStudentPerformance: async (classroomId: string, studentId: string): Promise<ApiResponse<{
        studentName: string;
        performanceData: Array<{ testName: string; studentScore: number; highestScore: number; }>
    }>> => {
        const response = await API.get(`/classrooms/${classroomId}/students/${studentId}/performance`);
        return response.data;
    }
};