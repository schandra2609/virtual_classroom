import { API } from "@/api/API";
import type { ApiResponse, Assignment, Submission, UpdateAssignmentData } from "@/api/types";

export const assignmentService = {
    /**
     * @route GET /api/v1/classrooms/:classroomId/assignments
     * @description Fetches all assignments for the classroom.
     */
    getClassroomAssignments: async (classroomId: string): Promise<ApiResponse<Assignment[]>> => {
        const response = await API.get(`/classrooms/${classroomId}/assignments`);
        return response.data;
    },

    /**
     * @route POST /api/v1/classrooms/:classroomId/assignments
     * @description Creates a new assignment (FormData for up to 3 attachments).
     */
    createAssignment: async (classroomId: string, formData: FormData): Promise<ApiResponse<Assignment>> => {
        const response = await API.post(`/classrooms/${classroomId}/assignments`, formData);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/assignments/:assignmentId
     * @description Updates assignment details or deadline.
     */
    updateAssignment: async (classroomId: string, assignmentId: string, data: UpdateAssignmentData): Promise<ApiResponse<Assignment>> => {
        const response = await API.patch(`/classrooms/${classroomId}/assignments/${assignmentId}`, data);
        return response.data;
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/assignments/:assignmentId
     * @description Permanently removes assignment and associated cloud storage files.
     */
    deleteAssignment: async (classroomId: string, assignmentId: string): Promise<ApiResponse<null>> => {
        const response = await API.delete(`/classrooms/${classroomId}/assignments/${assignmentId}`);
        return response.data;
    },

    /**
     * @route POST /api/v1/classrooms/:classroomId/assignments/:assignmentId/submit
     * @description Allows a student to upload their solution (FormData for up to 3 files).
     */
    submitSolution: async (classroomId: string, assignmentId: string, formData: FormData): Promise<ApiResponse<Submission>> => {
        const response = await API.post(
            `/classrooms/${classroomId}/assignments/${assignmentId}/submit`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data;
    },

    /**
     * @route GET /api/v1/classrooms/:classroomId/assignments/:assignmentId/submissions
     * @description Fetches all student submissions for review.
     */
    getAssignmentSubmissions: async (classroomId: string, assignmentId: string): Promise<ApiResponse<Submission[]>> => {
        const response = await API.get(`/classrooms/${classroomId}/assignments/${assignmentId}/submissions`);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/assignments/:assignmentId/submissions/:submissionId/grade
     * @description Submit a grade for a specific student's submission
     */
    gradeSubmission: async (classroomId: string, assignmentId: string, submissionId: string, marksObtained: number) => {
        const response = await API.patch(
            `/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
            { marksObtained }
        );
        return response.data;
    }
};