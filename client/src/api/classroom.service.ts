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
    getMyClassrooms: async (): Promise<ApiResponse<Classroom[]>> => {
        const response = await API.get('/classrooms');
        return response.data;
    },

    createClassroom: async (data: CreateClassroomData): Promise<ApiResponse<Classroom>> => {
        const response = await API.post('/classrooms', data);
        return response.data;
    },

    joinClassroom: async (data: JoinClassroomData): Promise<ApiResponse<null>> => {
        const response = await API.post('/classrooms/join', data);
        return response.data;
    },

    getClassroomById: async (classroomId: string): Promise<ApiResponse<Classroom>> => {
        const response = await API.get(`/classrooms/${classroomId}`);
        return response.data;
    },

    updateClassroom: async (classroomId: string, data: UpdateClassroomData): Promise<ApiResponse<Classroom>> => {
        const response = await API.patch(`/classrooms/${classroomId}`, data);
        return response.data;
    },

    deleteClassroom: async (classroomId: string): Promise<ApiResponse<null>> => {
        const response = await API.delete(`/classrooms/${classroomId}`);
        return response.data;
    },

    leaveClassroom: async (classroomId: string): Promise<ApiResponse<null>> => {
        const response = await API.delete(`/classrooms/${classroomId}/leave`);
        return response.data;
    },

    inviteCoTutor: async (classroomId: string, data: InviteTutorData): Promise<ApiResponse<null>> => {
        const response = await API.post(`/classrooms/${classroomId}/invite-tutor`, data);
        return response.data;
    },

    refreshJoiningCode: async (classroomId: string): Promise<ApiResponse<string>> => {
        const response = await API.patch(`/classrooms/${classroomId}/refresh-code`);
        return response.data;
    },

    transferOwnership: async (classroomId: string, data: TransferOwnershipData): Promise<ApiResponse<null>> => {
        const response = await API.patch(`/classrooms/${classroomId}/transfer-ownership`, data);
        return response.data;
    }
};