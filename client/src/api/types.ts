/**
 * @file types.ts
 * @description Centralized TypeScript interfaces for all API payloads and responses.
 * Ensures strict typing between the Redux store, API services, and React components.
 */

// ---------------------------------------------------------------------------
// GLOBAL API RESPONSE
// ---------------------------------------------------------------------------
export interface ApiResponse<T = any> {
	success: boolean;
	message: string;
	data: T;
}

// ---------------------------------------------------------------------------
// USER & AUTHENTICATION TYPES
// ---------------------------------------------------------------------------
export interface UserProfile {
	id: string;
	fullName: string;
	email: string;
	accountType: "STUDENT" | "TUTOR" | "ADMINISTRATOR";
	profilePhotoUrl?: string | null;
	isEmailVerified: boolean;
	tutorVerificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface ChangePasswordData {
	oldPassword: string;
	newPassword: string;
}

export interface VerifyEmailData {
	otp: string;
	purpose: string;
	payload?: any;
}

export interface AuthResponse {
	message: string;
	accessToken: string;
	user: UserProfile;
}

// ---------------------------------------------------------------------------
// ADMIN & LEDGER TYPES
// ---------------------------------------------------------------------------
export interface TutorApplication {
	id: string; // The underlying User ID
	applicationId: string; // The Ledger ID
	fullName: string;
	email: string;
	tutorQualificationUrl: string;
	tutorVerificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
	tutorStatusUpdatedAt: Date;
	tutorRejectionReason?: string | null;
	createdAt: Date;
}

// ---------------------------------------------------------------------------
// CLASSROOM TYPES
// ---------------------------------------------------------------------------
export interface Classroom {
	id: string;
	name: string;
	subject: string;
	batch: string;
	creatorId: string;
	joiningCode: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface ClassroomInvitation {
    id: string;
    classroomId: string;
    inviterId: string;
    inviteeEmail: string;
    role: "CO_TUTOR" | "STUDENT";
    status: "PENDING" | "ACCEPTED" | "EXPIRED";
    expiresAt: Date;
    createdAt: Date;
    classroom?: Partial<Classroom>;
    inviter?: { fullName: string };
}

export interface ClassroomMember {
    userId: string;
    classroomId: string;
    role: "CREATOR" | "CO_TUTOR" | "STUDENT";
    membershipStatus: "PENDING" | "APPROVED";
    feePaidUntil?: Date | null;
    joinedAt: Date;
    user: Partial<UserProfile>;
}

export interface CreateClassroomData {
    name: string;
    subject: string;
    batch: string;
}

export interface JoinClassroomData {
    joiningCode: string;
}

export interface UpdateClassroomData {
    name?: string;
    subject?: string;
    batch?: string;
}

export interface InviteTutorData {
    inviteeEmail: string;
}

export interface TransferOwnershipData {
    newOwnerId: string;
}

export interface UpdatePaymentData {
    feePaidUntil: Date;
}

// ---------------------------------------------------------------------------
// CLASSROOM MANAGEMENT TYPES
// ---------------------------------------------------------------------------
export interface Attachment {
    id: string;
    url: string;
    fileName: string;
    fileType: string;
    createdAt: Date;
}

export interface Announcement {
    id: string;
    message: string;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    classroomId: string;
    author: Partial<UserProfile>;
    attachments: Attachment[];
}

export interface Assignment {
    id: string;
    title: string;
    instruction: string;
    deadline: Date;
    maxScore: number;
    createdAt: Date;
    updatedAt: Date;
    classroomId: string;
    authorId: string;
    author: Partial<UserProfile>;
    attachments: Attachment[];
    mySubmission?: Submission;
    submissions?: Submission[];
    _count?: { 
        submissions: number;
        attempts?: number;
    };
}

export interface Submission {
    id: string;
    submittedAt: Date;
    content?: string;
    marksObtained?: number | null;
    assignmentId: string;
    studentId: string;
    student: Partial<UserProfile>;
    attachments: Attachment[];
}

export interface UpdateAssignmentData {
    title?: string;
    instruction?: string;
    deadline?: string | Date;
    maxScore?: number;
}

export interface Comment {
    id: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    announcementId: string;
    author: Partial<UserProfile>;
}

export interface CreateCommentData {
    text: string;
}

export interface QuestionPaper {
    id: string;
    title: string;
    liveAt: Date;
    duration: number;
    negativeMarking?: boolean;
    status: "SCHEDULED" | "LIVE" | "PAUSED" | "CANCELLED" | "COMPLETED";
    pauseTime: number;
    lastPausedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    classroomId: string;
    maxScore?: number; 
    mySubmission?: any; 
    submissions?: any[]; 
    author?: Partial<UserProfile>;
    questions?: Question[];
    _count?: {
        attempts: number;
        submissions?: number;
    };
}

export interface CreatePaperData {
    title: string;
    liveAt: Date;
    duration: number;
}

export interface Option {
    id: string;
    text: string;
    isCorrect?: boolean;
}

export interface Question {
    id: string;
    text: string;
    type: "MCQ" | "MSQ" | "NAT";
    marks: number;
    options?: Option[];
    numericalCorrectAnswer?: number | null;
}

export interface AddQuestionData {
    text: string;
    type: "MCQ" | "MSQ" | "NAT";
    marks: number;
    numericalCorrectAnswer?: number;
    options?: { text: string; isCorrect: boolean }[];
}

export interface Answer {
    id: string;
    selectedOptionId?: string | null;
    numericalAnswer?: number | null;
    questionId: string;
}

export interface TestAttempt {
    id: string;
    type: "OFFICIAL" | "PRACTICE";
    score?: number | null;
    submittedAt?: Date | null;
    createdAt: Date;
    studentId: string;
    questionPaperId: string;
    answers?: Answer[];
}

export interface UnifiedClasswork {
    id: string;
    title: string;
    description?: string;
    type: "ASSIGNMENT" | "CBT_EXAM";
    targetDate: Date;
    status?: string;
    creatorId: string;
    rawPayload: Assignment | QuestionPaper;
}

export interface CourseworkDetailsDialogProps {
	open: boolean;
    onOpenChange: (open: boolean) => void;
    work: UnifiedClasswork | null;
    classroomId: string;
    onSuccess?: () => void;
}

export interface ClassworkTabProps {
	classroom: Classroom;
}

export interface StudentPerformanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classroomId: string;
    studentId: string;
    studentName: string;
}

export interface AttemptPerformanceDialogProps {
    classroomId: string;
    paperId: string;
    paperTitle: string;
    studentName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface AttemptReviewOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface AttemptReviewDetail {
    id: string;
    text: string;
    type: "MCQ" | "MSQ" | "NAT";
    marks: number;
    correctAnswer: any; 
    studentAnswer: any; 
    options: AttemptReviewOption[];
}

export interface AttemptReviewResponse {
    title: string;
    score: number;
    details: AttemptReviewDetail[];
}

export interface UnifiedStudentRow {
	rowId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    isMissing: boolean;
    submissionId: string | null;
    documentUrl: string | null;
    documentName: string | null;
    submittedAt: Date | null;
    marksObtained: number | null;
}

export interface CreateCourseworkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void; 
    editData?: UnifiedClasswork | null;
}