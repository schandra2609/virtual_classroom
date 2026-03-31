// import API from "./API.ts";
import type { UserProfile } from "./user.service.ts";
import type { Attachment } from "./announcement.service.ts";

export interface Assignment {
    id: string;
    title: string;
    instruction: string;
    deadline: Date;
    createdAt: Date;
    updatedAt: Date;
    classroomId: string;
    authorId: string;
    author: Partial<UserProfile>;
    attachments: Attachment[];
}

export interface Submission {
    id: string;
    submittedAt: Date;
    content?: string;
    assignmentId: string;
    studentId: string;
    student: Partial<UserProfile>;
    attachments: Attachment[];
}

export interface UpdateAssignmentData {
    title?: string;
    instruction?: string;
    deadline?: Date;
}

let DUMMY_ASSIGNMENTS: Assignment[] = [
    {
        id: "asn_001",
        title: "Assignment 1: Database Normalization",
        instruction: "Complete the exercises in the attached PDF. Ensure BCNF.",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        createdAt: new Date(),
        updatedAt: new Date(),
        classroomId: "cls_101",
        authorId: "usr_456",
        author: { fullName: "Demo Tutor", accountType: "TUTOR" },
        attachments: []
    }
];

let DUMMY_SUBMISSIONS: Submission[] = [];

export const assignmentService = {
    /**
     * @route GET /api/v1/classrooms/:classroomId/assignments
     * @description Fetches all assignments for the classroom.
     */
    getClassroomAssignments: async (classroomId: string) => {
        console.log(`Mock API: Fetching assignments for ${classroomId}...`);
        return new Promise<{ assignments: Assignment[] }>((resolve) => {
            setTimeout(() => {
                const filtered = DUMMY_ASSIGNMENTS.filter(a => a.classroomId === classroomId);
                resolve({ assignments: filtered.length ? filtered : DUMMY_ASSIGNMENTS });
            }, 800);
        });
    },

    /**
     * @route POST /api/v1/classrooms/:classroomId/assignments
     * @description Creates a new assignment (FormData for up to 3 attachments).
     */
    createAssignment: async (classroomId: string, formData: FormData) => {
        console.log(`Mock API: Creating assignment in ${classroomId}...`, formData.get('title'));
        return new Promise<{ message: string; assignment: Assignment }>((resolve) => {
            setTimeout(() => {
                const newAssignment: Assignment = {
                    id: `asn_${Math.random().toString(36).substring(7)}`,
                    title: formData.get('title') as string || 'Untitled',
                    instruction: formData.get('instruction') as string || '',
                    deadline: new Date(formData.get('deadline') as string || Date.now()),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    classroomId,
                    authorId: "usr_456",
                    author: { fullName: "Demo Tutor", accountType: "TUTOR" },
                    attachments: []
                };
                DUMMY_ASSIGNMENTS.push(newAssignment);
                resolve({ message: 'Assignment created successfully', assignment: newAssignment });
            }, 1200);
        });
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/assignments/:assignmentId
     * @description Updates assignment details or deadline.
     */
    updateAssignment: async (_classroomId: string, assignmentId: string, data: UpdateAssignmentData) => {
        console.log(`Mock API: Updating assignment ${assignmentId}...`, data);
        return new Promise<{ message: string; assignment: Assignment }>((resolve) => {
            setTimeout(() => {
                const index = DUMMY_ASSIGNMENTS.findIndex(a => a.id === assignmentId);
                if (index > -1) {
                    DUMMY_ASSIGNMENTS[index] = { ...DUMMY_ASSIGNMENTS[index], ...data, updatedAt: new Date() };
                }
                resolve({ message: 'Assignment updated', assignment: DUMMY_ASSIGNMENTS[index] || DUMMY_ASSIGNMENTS[0] });
            }, 1000);
        });
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/assignments/:assignmentId
     * @description Permanently removes assignment and associated cloud storage files.
     */
    deleteAssignment: async (_classroomId: string, assignmentId: string) => {
        console.log(`Mock API: Deleting assignment ${assignmentId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => {
                DUMMY_ASSIGNMENTS = DUMMY_ASSIGNMENTS.filter(a => a.id !== assignmentId);
                resolve({ message: 'Assignment deleted successfully' });
            }, 1000);
        });
    },

    /**
     * @route POST /api/v1/classrooms/:classroomId/assignments/:assignmentId/submit
     * @description Allows a student to upload their solution (FormData for up to 3 files).
     */
    submitSolution: async (_classroomId: string, assignmentId: string, formData: FormData) => {
        console.log(`Mock API: Submitting solution for ${assignmentId}...`, formData.get('content'));
        return new Promise<{ message: string; submission: Submission }>((resolve) => {
            setTimeout(() => {
                const newSubmission: Submission = {
                    id: `sub_${Math.random().toString(36).substring(7)}`,
                    submittedAt: new Date(),
                    content: formData.get('content') as string || '',
                    assignmentId,
                    studentId: "usr_123",
                    student: { fullName: "Demo Student", accountType: "STUDENT" },
                    attachments: []
                };
                DUMMY_SUBMISSIONS.push(newSubmission);
                resolve({ message: 'Solution submitted successfully', submission: newSubmission });
            }, 1500);
        });
    },

    /**
     * @route GET /api/v1/classrooms/:classroomId/assignments/:assignmentId/submissions
     * @description Fetches all student submissions for review.
     */
    getAssignmentSubmissions: async (_classroomId: string, assignmentId: string) => {
        console.log(`Mock API: Fetching submissions for assignment ${assignmentId}...`);
        return new Promise<{ submissions: Submission[] }>((resolve) => {
            setTimeout(() => {
                const filtered = DUMMY_SUBMISSIONS.filter(s => s.assignmentId === assignmentId);
                resolve({ submissions: filtered });
            }, 800);
        });
    }
};