// import API from "./API";

export interface Option {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface Question {
    id: string;
    text: string;
    type: 'MCQ' | 'MSQ' | 'NAT';
    marks: number;
    numericalCorrectAnswer?: number | null;
    qpaperId: string;
    options?: Option[];
}

export interface AddQuestionData {
    text: string;
    type: 'MCQ' | 'MSQ' | 'NAT';
    marks: number;
    numericalCorrectAnswer?: number;
    options?: { text: string; isCorrect: boolean }[];
}

export const questionService = {
    /** @route POST /api/v1/classrooms/:classroomId/papers/:paperId/questions */
    addQuestion: async (_classroomId: string, paperId: string, data: AddQuestionData) => {
        console.log(`Mock API: Adding question to paper ${paperId}...`);
        return new Promise<{ message: string; question: Question }>((resolve) => {
            setTimeout(() => {
                resolve({
                    message: 'Question added',
                    question: { id: `q_${Math.random().toString(36).substring(7)}`, qpaperId: paperId, ...data } as Question
                });
            }, 1000);
        });
    },

    /** @route PATCH /api/v1/classrooms/:classroomId/papers/:paperId/questions/:questionId */
    updateQuestion: async (_classroomId: string, _paperId: string, _questionId: string, _data: Partial<AddQuestionData>) => {
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Question updated' }), 800);
        });
    },

    /** @route DELETE /api/v1/classrooms/:classroomId/papers/:paperId/questions/:questionId */
    deleteQuestion: async (_classroomId: string, _paperId: string, _questionId: string) => {
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Question removed from paper' }), 800);
        });
    }
};