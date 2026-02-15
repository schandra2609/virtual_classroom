/**
 * @file socket.service.ts
 * @module Services/Socket
 * @description Service layer for managing Socket.io events and room subscriptions.
 * Handles logic for joining/leaving classrooms and broadcasting updates.
 */
import { io } from "../configs/socket.config.ts";
import Logger from "../utils/Logger.ts";

/**
 * @function setupSocketEvents
 * @description Sets up event listeners for the socket instance.
 * @param {import("socket.io").Socket} socket - The connected socket instance.
 */
export const setupSocketEvents = (socket: any) => {
    /**
     * @event join_classroom
     * @description Subscribes the client to a specific classroom room.
     * payload: { classroomId: string }
     */
    socket.on("join_classroom", (classroomId: string) => {
        if (classroomId) {
            socket.join(classroomId);
            Logger.info(`Socket ${socket.id} joined classroom: ${classroomId}`);
        }
    });

    /**
     * @event leave_classroom
     * @description Unsubscribes the client from a specific classroom room.
     * payload: { classroomId: string }
     */
    socket.on("leave_classroom", (classroomId: string) => {
        if (classroomId) {
            socket.leave(classroomId);
            Logger.info(`Socket ${socket.id} left classroom: ${classroomId}`);
        }
    });
};

// Import this in socket.config.ts inside initSocket -> io.on("connection")
// OR better yet, let's keep the listener logic here and call it from the config if possible,
// BUT to avoid circular dependencies (Service imports Config, Config imports Service),
// it is safer to keep the `io.on('connection')` logic simple in `socket.config.ts`
// OR have `initSocket` import this service function.
// For now, I will export standalone notification functions.
// I will refrain from importing `setupSocketEvents` in `socket.config.ts` to avoid circular dep
// if I need `io` here.
// Actually, `socket.config.ts` defines `io`. `socket.service.ts` imports `io`.
// So `socket.config.ts` cannot import `socket.service.ts`.
// I will rely on `socket.config.ts` having the basic connection logic,
// and potentially moving the event handlers there or using a different pattern.
// However, for this simple case, `join_classroom` is client-initiated.
// Let's implement helper functions for broadcasting first.

/**
 * @function notifyNewAnnouncement
 * @description Broadcasts a 'new_announcement' event to members of a classroom.
 * @param {string} classroomId - The target classroom ID.
 * @param {any} data - The announcement data.
 */
export const notifyNewAnnouncement = (classroomId: string, data: any) => {
    if (io) {
        io.to(classroomId).emit("new_announcement", data);
        Logger.info(`Broadcasted new_announcement to ${classroomId}`);
    }
};

/**
 * @function notifyNewComment
 * @description Broadcasts a 'new_comment' event to members of a classroom.
 * @param {string} classroomId - The target classroom ID.
 * @param {any} data - The comment data.
 */
export const notifyNewComment = (classroomId: string, data: any) => {
    if (io) {
        io.to(classroomId).emit("new_comment", data);
        Logger.info(`Broadcasted new_comment to ${classroomId}`);
    }
};

/**
 * @function notifyTestStatusChange
 * @description Broadcasts test lifecycle events.
 * @param {string} classroomId - Room to broadcast to.
 * @param {string} paperId - The specific test.
 * @param {string} status - LIVE | PAUSED | CANCELLED | COMPLETED
 */
export const notifyTestStatusChange = (classroomId: string, paperId: string, status: string) => {
    if (io) {
        io.to(classroomId).emit("test_status_change", { paperId, status });
        Logger.info(`Test ${paperId} status changed to ${status} in room ${classroomId}`);
    }
};