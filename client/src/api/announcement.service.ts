// import API from "./API.ts";
import type { UserProfile } from "./user.service.ts";

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

let DUMMY_ANNOUNCEMENTS: Announcement[] = [
    {
        id: "ann_001",
        message: "Welcome to the class! Please check the syllabus attached.",
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: "usr_456",
        classroomId: "cls_101",
        author: { fullName: "Demo Tutor", accountType: "TUTOR" },
        attachments: [
            { id: "att_1", url: "#", fileName: "syllabus.pdf", fileType: "application/pdf", createdAt: new Date() }
        ]
    }
];

export const announcementService = {
    /**
     * @route GET /api/v1/classrooms/:classroomId/announcements
     * @description Retrieve all announcements for the classroom feed.
     */
    getAnnouncements: async (classroomId: string) => {
        console.log(`Mock API: Fetching announcements for ${classroomId}...`);
        return new Promise<{ announcements: Announcement[] }>((resolve) => {
            setTimeout(() => {
                const filtered = DUMMY_ANNOUNCEMENTS.filter(a => a.classroomId === classroomId);
                resolve({ announcements: filtered.length ? filtered : DUMMY_ANNOUNCEMENTS });
            }, 800);
        });
    },

    /**
     * @route POST /api/v1/classrooms/:classroomId/announcements
     * @description Create a new announcement (FormData for up to 5 attachments).
     */
    createAnnouncement: async (classroomId: string, formData: FormData) => {
        console.log(`Mock API: Creating announcement in ${classroomId}...`, formData.get('message'));
        return new Promise<{ message: string; announcement: Announcement }>((resolve) => {
            setTimeout(() => {
                const newAnnouncement: Announcement = {
                    id: `ann_${Math.random().toString(36).substring(7)}`,
                    message: formData.get('message') as string || '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    authorId: "usr_456", // Mock author
                    classroomId,
                    author: { fullName: "Demo Tutor", accountType: "TUTOR" },
                    attachments: [] // Mocking empty attachments for now
                };
                DUMMY_ANNOUNCEMENTS.unshift(newAnnouncement);
                resolve({ message: 'Announcement posted successfully', announcement: newAnnouncement });
            }, 1200);
        });
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/announcements/:announcementId
     * @description Permanently removes an announcement and its storage assets.
     */
    deleteAnnouncement: async (classroomId: string, announcementId: string) => {
        console.log(`Mock API: Deleting announcement ${announcementId} from ${classroomId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => {
                DUMMY_ANNOUNCEMENTS = DUMMY_ANNOUNCEMENTS.filter(a => a.id !== announcementId);
                resolve({ message: 'Announcement deleted successfully' });
            }, 1000);
        });
    }
};