// import API from "./API.ts";
import type { UserProfile } from "./user.service.ts";

export interface ClassroomMember {
    userId: string;
    classroomId: string;
    role: 'CREATOR' | 'CO_TUTOR' | 'STUDENT';
    membershipStatus: 'PENDING' | 'APPROVED';
    feePaidUntil?: Date | null;
    joinedAt: Date;
    user: Partial<UserProfile>;
}

export interface UpdatePaymentData {
    feePaidUntil: Date;
}

const DUMMY_MEMBERS: ClassroomMember[] = [
    {
        userId: "usr_123",
        classroomId: "cls_101",
        role: "STUDENT",
        membershipStatus: "APPROVED",
        joinedAt: new Date(),
        user: { fullName: "Demo Student", email: "student@demo.com" }
    },
    {
        userId: "usr_999",
        classroomId: "cls_101",
        role: "STUDENT",
        membershipStatus: "PENDING",
        joinedAt: new Date(),
        user: { fullName: "Pending Student", email: "pending@demo.com" }
    }
];

export const memberService = {
    /**
     * @route GET /api/v1/classrooms/:classroomId/members
     * @description Fetches all members (or filtered by PENDING/APPROVED status)
     */
    getClassroomMembers: async (classroomId: string, statusFilter?: 'PENDING' | 'APPROVED') => {
        console.log(`Mock API: Fetching members for ${classroomId} (Filter: ${statusFilter})...`);
        return new Promise<{ members: ClassroomMember[] }>((resolve) => {
            setTimeout(() => {
                let filtered = DUMMY_MEMBERS;
                if (statusFilter) {
                    filtered = DUMMY_MEMBERS.filter(m => m.membershipStatus === statusFilter);
                }
                resolve({ members: filtered });
            }, 800);
        });
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/members/:memberId
     * @description Expels a member from the classroom
     */
    removeMember: async (classroomId: string, memberId: string) => {
        console.log(`Mock API: Removing member ${memberId} from ${classroomId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Member removed successfully' }), 1000);
        });
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/members/:studentId/approve
     * @description Approves a student's pending join request
     */
    approveStudent: async (classroomId: string, studentId: string) => {
        console.log(`Mock API: Approving student ${studentId} in ${classroomId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Student request approved' }), 800);
        });
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/members/:studentId/payment
     * @description Updates the fee-validity period (expiry date) for a student
     */
    updateStudentPayment: async (classroomId: string, studentId: string, data: UpdatePaymentData) => {
        console.log(`Mock API: Updating payment for ${studentId} in ${classroomId}...`, data);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Payment period updated successfully' }), 1000);
        });
    }
};