// import API from "./API";
import type { UserProfile } from "./user.service";

export interface TutorApplication extends UserProfile {
    tutorQualificationUrl: string;
    tutorStatusUpdatedAt: Date;
    tutorRejectionReason?: string | null;
}

export const adminService = {
    /** * @route GET /api/v1/admin/tutors
     * @description Fetch tutor applications by status (PENDING, VERIFIED, REJECTED).
     */
    getTutorApplications: async (statusFilter?: 'PENDING' | 'VERIFIED' | 'REJECTED') => {
        console.log(`Mock API: Fetching tutor applications (Filter: ${statusFilter})...`);
        return new Promise<{ applications: TutorApplication[] }>((resolve) => {
            setTimeout(() => resolve({ applications: [] }), 800);
        });
    },

    /** * @route PATCH /api/v1/admin/tutors/:tutorId/approve
     * @description Approve a specific tutor application.
     */
    approveTutor: async (tutorId: string) => {
        console.log(`Mock API: Approving tutor ${tutorId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Tutor application approved successfully.' }), 1000);
        });
    },

    /** * @route PATCH /api/v1/admin/tutors/:tutorId/reject
     * @description Reject a specific tutor application with a reason.
     */
    rejectTutor: async (tutorId: string, _reason: string) => {
        console.log(`Mock API: Rejecting tutor ${tutorId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Tutor application rejected.' }), 1000);
        });
    }
};