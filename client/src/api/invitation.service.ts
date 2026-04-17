import { API } from "@/api/API";
import type { ApiResponse, ClassroomInvitation } from "@/api/types";

export const invitationService = {
    /**
     * @route GET /api/v1/invitations
     * @description Retrieves list of pending invitations for the logged-in user
     */
    getMyInvitations: async (): Promise<ApiResponse<ClassroomInvitation[]>> => {
        const response = await API.get('/invitations');
        return response.data;
    },

    /**
     * @route POST /api/v1/invitations/:invitationId/accept
     * @description Accepts a specific invitation and grants classroom access as a Co-Tutor
     */
    acceptCoTutorInvitation: async (invitationId: string): Promise<ApiResponse<null>> => {
        const response = await API.post(`/invitations/${invitationId}/accept`);
        return response.data;
    }
};