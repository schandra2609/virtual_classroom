// import API from "./API";

export interface Answer {
    id: string;
    selectedOptionId?: string | null;
    numericalAnswer?: number | null;
    questionId: string;
}

export interface TestAttempt {
    id: string;
    type: 'OFFICIAL' | 'PRACTICE';
    score?: number | null;
    submittedAt?: Date | null;
    createdAt: Date;
    studentId: string;
    questionPaperId: string;
    answers?: Answer[];
}

export const testattemptService = {
    /** @route GET /api/v1/classrooms/:classroomId/papers/:paperId/attempts */
    getMyAttemptsForPaper: async (_classroomId: string, _paperId: string) => {
        console.log(`Mock API: Fetching attempt history...`);
        return new Promise<{ attempts: TestAttempt[] }>((resolve) => {
            setTimeout(() => resolve({ attempts: [] }), 800);
        });
    },

    /** @route POST /api/v1/classrooms/:classroomId/papers/:paperId/attempts */
    startTestAttempt: async (_classroomId: string, paperId: string, type: 'OFFICIAL' | 'PRACTICE') => {
        console.log(`Mock API: Starting ${type} attempt...`);
        return new Promise<{ message: string; attempt: TestAttempt }>((resolve) => {
            setTimeout(() => {
                resolve({
                    message: 'Attempt started',
                    attempt: { id: `att_${Math.random()}`, type, createdAt: new Date(), studentId: "usr_123", questionPaperId: paperId }
                });
            }, 1200);
        });
    },

    /** @route POST /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/answers */
    submitAnswer: async (_classroomId: string, _paperId: string, _attemptId: string, _data: Partial<Answer>) => {
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Answer synced' }), 200); 
        });
    },

    /** @route POST /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/submit */
    submitTestAttempt: async (_classroomId: string, _paperId: string, _attemptId: string) => {
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Test submitted for evaluation' }), 1500);
        });
    },

    /** @route GET /api/v1/classrooms/:classroomId/papers/:paperId/attempts/:attemptId/review */
    getAttemptReview: async (_classroomId: string, _paperId: string, _attemptId: string) => {
        return new Promise<{ review: any }>((resolve) => {
            setTimeout(() => resolve({ review: { score: 85, feedback: "Great job on the MSQ section." } }), 1000);
        });
    }
};