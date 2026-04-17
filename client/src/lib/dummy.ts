import { addDays, subDays } from "date-fns";
import type { 
    UserProfile, 
    TutorApplication, 
    Classroom, 
    ClassroomMember,
    Assignment,
    QuestionPaper,
} from "@/api/types";

const now = new Date();

// ==========================================
// 1. USERS
// ==========================================
export const mockUsers: Record<string, UserProfile> = {
    admin1: {
        id: "admin-1",
        fullName: "System Administrator",
        email: "admin@echoscape.edu",
        accountType: "ADMINISTRATOR",
        isEmailVerified: true,
        tutorVerificationStatus: null,
        createdAt: subDays(now, 100),
        updatedAt: subDays(now, 100),
    },
    tutor1: {
        id: "tutor-1",
        fullName: "Dr. Sarah Chen",
        email: "sarah.chen@university.edu",
        accountType: "TUTOR",
        isEmailVerified: true,
        tutorVerificationStatus: "VERIFIED",
        createdAt: subDays(now, 50),
        updatedAt: subDays(now, 48),
    },
    tutor2: {
        id: "tutor-2",
        fullName: "James Rodriguez",
        email: "j.rodriguez@techbootcamp.com",
        accountType: "TUTOR",
        isEmailVerified: true,
        tutorVerificationStatus: "PENDING",
        createdAt: subDays(now, 2),
        updatedAt: subDays(now, 2),
    },
    student1: {
        id: "student-1",
        fullName: "Alex Rivera",
        email: "arivera@student.edu",
        accountType: "STUDENT",
        isEmailVerified: true,
        tutorVerificationStatus: null,
        profilePhotoUrl: "https://i.pravatar.cc/150?u=student1",
        createdAt: subDays(now, 30),
        updatedAt: subDays(now, 30),
    },
    student2: {
        id: "student-2",
        fullName: "Priya Patel",
        email: "ppatel@student.edu",
        accountType: "STUDENT",
        isEmailVerified: true,
        tutorVerificationStatus: null,
        profilePhotoUrl: "https://i.pravatar.cc/150?u=student2",
        createdAt: subDays(now, 28),
        updatedAt: subDays(now, 28),
    }
};

// ==========================================
// 2. ADMIN HUB (TUTOR APPLICATIONS)
// ==========================================
export const mockApplications: TutorApplication[] = [
    {
        id: mockUsers.tutor2.id,
        applicationId: "app-1002",
        fullName: mockUsers.tutor2.fullName,
        email: mockUsers.tutor2.email,
        tutorQualificationUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        tutorVerificationStatus: "PENDING",
        tutorStatusUpdatedAt: subDays(now, 2),
        createdAt: subDays(now, 2),
    },
    {
        id: "tutor-3",
        applicationId: "app-1003",
        fullName: "Marcus Johnson",
        email: "mjohnson@freelance.edu",
        tutorQualificationUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        tutorVerificationStatus: "REJECTED",
        tutorStatusUpdatedAt: subDays(now, 5),
        tutorRejectionReason: "The provided identification document is expired. Please upload a valid, current ID.",
        createdAt: subDays(now, 10),
    },
    {
        id: mockUsers.tutor1.id,
        applicationId: "app-1001",
        fullName: mockUsers.tutor1.fullName,
        email: mockUsers.tutor1.email,
        tutorQualificationUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        tutorVerificationStatus: "VERIFIED",
        tutorStatusUpdatedAt: subDays(now, 48),
        createdAt: subDays(now, 50),
    }
];

// ==========================================
// 3. CLASSROOM
// ==========================================
export const mockClassroom: Classroom = {
    id: "cls-react-node",
    name: "Advanced Full Stack Development",
    subject: "PERN Stack & System Architecture",
    batch: "Spring 2026",
    creatorId: mockUsers.tutor1.id,
    joinCode: "DEV89X",
    createdAt: subDays(now, 40),
    updatedAt: subDays(now, 40),
};

export const mockMembers: ClassroomMember[] = [
    {
        userId: mockUsers.tutor1.id,
        classroomId: mockClassroom.id,
        role: "CREATOR",
        membershipStatus: "APPROVED",
        joinedAt: subDays(now, 40),
        user: mockUsers.tutor1
    },
    {
        userId: mockUsers.student1.id,
        classroomId: mockClassroom.id,
        role: "STUDENT",
        membershipStatus: "APPROVED",
        joinedAt: subDays(now, 20),
        user: mockUsers.student1
    },
    {
        userId: mockUsers.student2.id,
        classroomId: mockClassroom.id,
        role: "STUDENT",
        membershipStatus: "APPROVED",
        joinedAt: subDays(now, 18),
        user: mockUsers.student2
    }
];

// ==========================================
// 4. COURSEWORK (ASSIGNMENTS & CBT)
// ==========================================
export const mockAssignments: Assignment[] = [
    {
        id: "assign-1",
        title: "RESTful API Design Document",
        instruction: "Design a complete RESTful API specification for an e-commerce platform. Include endpoints, HTTP methods, and status codes. Please submit a single PDF.",
        deadline: addDays(now, 3),
        maxScore: 100,
        classroomId: mockClassroom.id,
        authorId: mockUsers.tutor1.id,
        author: mockUsers.tutor1,
        createdAt: subDays(now, 2),
        updatedAt: subDays(now, 2),
        attachments: [
            {
                id: "att-1",
                url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                fileName: "API_Best_Practices_Guide.pdf",
                fileType: "application/pdf",
                createdAt: subDays(now, 2)
            }
        ]
    }
];

export const mockExams: QuestionPaper[] = [
    {
        id: "exam-1",
        title: "Docker & Containerization Quiz",
        liveAt: addDays(now, 5),
        duration: 45,
        status: "SCHEDULED",
        pauseTime: 0,
        classroomId: mockClassroom.id,
        creatorId: mockUsers.tutor1.id,
        createdAt: subDays(now, 1),
        updatedAt: subDays(now, 1),
    },
    {
        id: "exam-2",
        title: "TypeScript Interfaces Assessment",
        liveAt: subDays(now, 7),
        duration: 30,
        status: "COMPLETED",
        pauseTime: 0,
        classroomId: mockClassroom.id,
        creatorId: mockUsers.tutor1.id,
        createdAt: subDays(now, 10),
        updatedAt: subDays(now, 10),
    }
];

// ==========================================
// 5. STUDENT ANALYTICS (RECHARTS)
// ==========================================
export const mockStudentPerformance = {
    studentName: "Alex Rivera",
    performanceData: [
        { testName: "Database Schema Quiz", studentScore: 85, highestScore: 100 },
        { testName: "Auth Middleware Assessment", studentScore: 92, highestScore: 95 },
        { testName: "TypeScript Interfaces", studentScore: 78, highestScore: 100 },
        { testName: "Frontend State Management", studentScore: 88, highestScore: 90 },
        { testName: "Docker Midterm", studentScore: 95, highestScore: 98 },
    ]
};