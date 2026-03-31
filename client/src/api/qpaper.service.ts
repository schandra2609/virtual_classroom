// import API from "./API";

export interface QuestionPaper {
    id: string;
    title: string;
    liveAt: Date;
    duration: number; // in minutes
    status: 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
    pauseTime: number;
    lastPausedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    classroomId: string;
}

export interface CreatePaperData {
    title: string;
    liveAt: Date;
    duration: number;
}

// Dummy Data
let DUMMY_PAPERS: QuestionPaper[] = [
    {
        id: "qp_001",
        title: "Midterm: Network Protocols",
        liveAt: new Date(Date.now() + 86400000), // Tomorrow
        duration: 60,
        status: "SCHEDULED",
        pauseTime: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        creatorId: "usr_456",
        classroomId: "cls_101"
    }
];

export const qpaperService = {
    /** @route GET /api/v1/classrooms/:classroomId/papers */
    getAllQuestionPapers: async (classroomId: string) => {
        console.log(`Mock API: Fetching papers for ${classroomId}...`);
        return new Promise<{ papers: QuestionPaper[] }>((resolve) => {
            setTimeout(() => resolve({ papers: DUMMY_PAPERS }), 800);
        });
    },

    /** @route POST /api/v1/classrooms/:classroomId/papers */
    createQuestionPaper: async (classroomId: string, data: CreatePaperData) => {
        console.log(`Mock API: Creating paper in ${classroomId}...`, data);
        return new Promise<{ message: string; paper: QuestionPaper }>((resolve) => {
            setTimeout(() => {
                const newPaper: QuestionPaper = {
                    id: `qp_${Math.random().toString(36).substring(7)}`,
                    ...data,
                    status: 'SCHEDULED',
                    pauseTime: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    creatorId: "usr_456",
                    classroomId
                };
                DUMMY_PAPERS.push(newPaper);
                resolve({ message: 'Paper created', paper: newPaper });
            }, 1000);
        });
    },

    /** @route GET /api/v1/classrooms/:classroomId/papers/:paperId */
    getQuestionPaperById: async (_classroomId: string, _paperId: string) => {
        return new Promise<{ paper: QuestionPaper }>((resolve) => {
            setTimeout(() => resolve({ paper: DUMMY_PAPERS[0] }), 800);
        });
    },

    /** @route PATCH /api/v1/classrooms/:classroomId/papers/:paperId */
    updateQuestionPaper: async (_classroomId: string, _paperId: string, _data: Partial<CreatePaperData>) => {
        return new Promise<{ message: string; paper: QuestionPaper }>((resolve) => {
            setTimeout(() => resolve({ message: 'Paper updated', paper: DUMMY_PAPERS[0] }), 1000);
        });
    },

    /** @route DELETE /api/v1/classrooms/:classroomId/papers/:paperId */
    deleteQuestionPaper: async (_classroomId: string, _paperId: string) => {
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Paper deleted permanently' }), 1000);
        });
    },

    /** @route GET /api/v1/classrooms/:classroomId/papers/:paperId/timer */
    getTimerSync: async (_classroomId: string, _paperId: string) => {
        return new Promise<{ remainingSeconds: number }>((resolve) => {
            setTimeout(() => resolve({ remainingSeconds: 3600 }), 300);
        });
    },

    /** @route PATCH /api/v1/classrooms/:classroomId/papers/:paperId/status */
    changePaperStatus: async (_classroomId: string, _paperId: string, status: QuestionPaper['status']) => {
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: `Status changed to ${status}` }), 800);
        });
    }
};