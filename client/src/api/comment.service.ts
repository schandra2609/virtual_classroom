// import API from "./API";
import type { UserProfile } from "./user.service";

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

let DUMMY_COMMENTS: Comment[] = [
    {
        id: "cmt_001",
        text: "Thank you for the update!",
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: "usr_123",
        announcementId: "ann_001",
        author: { fullName: "Demo Student", accountType: "STUDENT" }
    }
];

export const commentService = {
    /**
     * @route GET /api/v1/classrooms/:classroomId/announcements/:announcementId/comments
     * @description Fetch all comments for a specific announcement.
     */
    getCommentsForAnnouncement: async (_classroomId: string, announcementId: string) => {
        console.log(`Mock API: Fetching comments for announcement ${announcementId}...`);
        return new Promise<{ comments: Comment[] }>((resolve) => {
            setTimeout(() => {
                const filtered = DUMMY_COMMENTS.filter(c => c.announcementId === announcementId);
                resolve({ comments: filtered });
            }, 500);
        });
    },

    /**
     * @route POST /api/v1/classrooms/:classroomId/announcements/:announcementId/comments
     * @description Post a new comment to the announcement.
     */
    createComment: async (_classroomId: string, announcementId: string, data: CreateCommentData) => {
        console.log(`Mock API: Posting comment to ${announcementId}...`, data);
        return new Promise<{ message: string; comment: Comment }>((resolve) => {
            setTimeout(() => {
                const newComment: Comment = {
                    id: `cmt_${Math.random().toString(36).substring(7)}`,
                    text: data.text,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    authorId: "usr_123",
                    announcementId,
                    author: { fullName: "Demo Student", accountType: "STUDENT" }
                };
                DUMMY_COMMENTS.push(newComment);
                resolve({ message: 'Comment posted', comment: newComment });
            }, 800);
        });
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/announcements/:announcementId/comments/:commentId
     * @description Update text of a specific comment.
     */
    updateComment: async (_classroomId: string, _announcementId: string, commentId: string, data: CreateCommentData) => {
        console.log(`Mock API: Updating comment ${commentId}...`);
        return new Promise<{ message: string; comment: Comment }>((resolve) => {
            setTimeout(() => {
                const index = DUMMY_COMMENTS.findIndex(c => c.id === commentId);
                if (index > -1) {
                    DUMMY_COMMENTS[index] = { ...DUMMY_COMMENTS[index], text: data.text, updatedAt: new Date() };
                }
                resolve({ message: 'Comment updated', comment: DUMMY_COMMENTS[index] || DUMMY_COMMENTS[0] });
            }, 800);
        });
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/announcements/:announcementId/comments/:commentId
     * @description Permanently remove a comment.
     */
    deleteComment: async (_classroomId: string, _announcementId: string, commentId: string) => {
        console.log(`Mock API: Deleting comment ${commentId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => {
                DUMMY_COMMENTS = DUMMY_COMMENTS.filter(c => c.id !== commentId);
                resolve({ message: 'Comment deleted' });
            }, 800);
        });
    }
};