// import API from "./API.ts";

export interface Classroom {
    id: string;
    name: string;
    subject: string;
    batch: string;
    joiningCode: string;
    createdAt: Date;
    updatedAt: Date;
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

let DUMMY_CLASSROOMS: Classroom[] = [
    {
        id: "cls_101",
        name: "Computer Networks",
        subject: "CSE 401",
        batch: "2022-2026",
        joiningCode: "CN2026",
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

export const classroomService = {
    /**
     * @route GET /api/v1/classrooms
     * @description Fetch classrooms for the logged-in user
     */
    getMyClassrooms: async () => {
        console.log('Mock API: Fetching my classrooms...');
        return new Promise<{ classrooms: Classroom[] }>((resolve) => {
            setTimeout(() => resolve({ classrooms: DUMMY_CLASSROOMS }), 800);
        });
    },

    /**
     * @route POST /api/v1/classrooms
     * @description Initialize a new classroom (Tutors only)
     */
    createClassroom: async (data: CreateClassroomData) => {
        console.log('Mock API: Creating classroom...', data);
        return new Promise<{ message: string; classroom: Classroom }>((resolve) => {
            setTimeout(() => {
                const newClassroom: Classroom = {
                    id: `cls_${Math.random().toString(36).substring(7)}`,
                    ...data,
                    joiningCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                DUMMY_CLASSROOMS.push(newClassroom);
                resolve({ message: 'Classroom created', classroom: newClassroom });
            }, 1000);
        });
    },

    /**
     * @route POST /api/v1/classrooms/join
     * @description Students join a classroom via joining code
     */
    joinClassroom: async (data: JoinClassroomData) => {
        console.log('Mock API: Joining classroom...', data);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Join request sent. Waiting for tutor approval.' }), 1000);
        });
    },

    /**
     * @route GET /api/v1/classrooms/:classroomId
     * @description Detailed view of a specific classroom
     */
    getClassroomById: async (classroomId: string) => {
        console.log(`Mock API: Fetching classroom ${classroomId}...`);
        return new Promise<{ classroom: Classroom }>((resolve, _reject) => {
            setTimeout(() => {
                const classroom = DUMMY_CLASSROOMS.find(c => c.id === classroomId) || DUMMY_CLASSROOMS[0];
                resolve({ classroom });
            }, 800);
        });
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId
     * @description Update classroom metadata (Creator only)
     */
    updateClassroom: async (classroomId: string, data: UpdateClassroomData) => {
        console.log(`Mock API: Updating classroom ${classroomId}...`, data);
        return new Promise<{ message: string; classroom: Classroom }>((resolve) => {
            setTimeout(() => {
                const index = DUMMY_CLASSROOMS.findIndex(c => c.id === classroomId);
                if (index > -1) {
                    DUMMY_CLASSROOMS[index] = { ...DUMMY_CLASSROOMS[index], ...data, updatedAt: new Date() };
                }
                resolve({ message: 'Classroom updated', classroom: DUMMY_CLASSROOMS[index] || DUMMY_CLASSROOMS[0] });
            }, 1000);
        });
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId
     * @description Permanent removal of a classroom (Creator only)
     */
    deleteClassroom: async (classroomId: string) => {
        console.log(`Mock API: Deleting classroom ${classroomId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => {
                DUMMY_CLASSROOMS = DUMMY_CLASSROOMS.filter(c => c.id !== classroomId);
                resolve({ message: 'Classroom deleted permanently' });
            }, 1500);
        });
    },

    /**
     * @route DELETE /api/v1/classrooms/:classroomId/leave
     * @description Member leaves the classroom
     */
    leaveClassroom: async (classroomId: string) => {
        console.log(`Mock API: Leaving classroom ${classroomId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'You have left the classroom' }), 1000);
        });
    },

    /**
     * @route POST /api/v1/classrooms/:classroomId/invite-tutor
     * @description Issue staff invitation (Creator only)
     */
    inviteCoTutor: async (classroomId: string, data: InviteTutorData) => {
        console.log(`Mock API: Inviting co-tutor to ${classroomId}...`, data);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: `Invitation sent to ${data.inviteeEmail}` }), 1000);
        });
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/refresh-code
     * @description Regenerate joining code (Creator only)
     */
    refreshJoiningCode: async (classroomId: string) => {
        console.log(`Mock API: Refreshing joining code for ${classroomId}...`);
        return new Promise<{ message: string; newCode: string }>((resolve) => {
            setTimeout(() => {
                const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                resolve({ message: 'Joining code refreshed', newCode });
            }, 800);
        });
    },

    /**
     * @route PATCH /api/v1/classrooms/:classroomId/transfer-ownership
     * @description Change classroom owner (Creator only)
     */
    transferOwnership: async (classroomId: string, data: TransferOwnershipData) => {
        console.log(`Mock API: Transferring ownership of ${classroomId} to ${data.newOwnerId}...`);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => resolve({ message: 'Ownership transferred successfully' }), 1200);
        });
    }
};