// import API from "./API.ts";
import type { Classroom } from "./classroom.service.ts";

export interface ClassroomInvitation {
    id: string;
    classroomId: string;
    inviterId: string;
    inviteeEmail: string;
    status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
    expiresAt: Date;
    createdAt: Date;
    classroom?: Partial<Classroom>;
}

const DUMMY_INVITATIONS: ClassroomInvitation[] = [
    {
        id: "inv_001",
        classroomId: "cls_101",
        inviterId: "usr_456",
        inviteeEmail: "tutor@demo.com",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        classroom: { name: "Computer Networks", subject: "CSE 401" }
    }
];

export const invitationService = {
    /**
     * @route GET /api/v1/invitations
     * @description Retrieves list of pending invitations for the logged-in user
     */
    getMyInvitations: async () => {
        console.log('Mock API: Fetching my invitations...');
        return new Promise<{ invitations: ClassroomInvitation[] }>((resolve) => {
            setTimeout(() => resolve({ invitations: DUMMY_INVITATIONS }), 800);
        });
    },

    /**
     * @route POST /api/v1/invitations/:invitationId/accept
     * @description Accepts a specific invitation and grants classroom access as a Co-Tutor
     */
    acceptCoTutorInvitation: async (invitationId: string) => {
        console.log(`Mock API: Accepting invitation ${invitationId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Invitation accepted. You are now a Co-Tutor.' }), 1000);
        });
    }
};