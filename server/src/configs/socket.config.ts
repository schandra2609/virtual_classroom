/**
 * @file socket.config.ts
 * @module Config/Socket
 * @description Configuration and initialization of the Socket.io server.
 * Includes CORS setup and JWT-based authentication middleware for secure connections.
 */
import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { ENV_CONFIG } from "./env.config.ts";
import Logger from "../utils/Logger.ts";

/**
 * @constant io
 * @description The singleton instance of the Socket.io server.
 */
export let io: SocketIOServer;

/**
 * @function initSocket
 * @description Initializes the Socket.io server and attaches it to the existing HTTP server.
 * @param {HttpServer} httpServer - The Node.js HTTP server instance.
 */
export const initSocket = (httpServer: HttpServer): void => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: ENV_CONFIG.CORS_ORIGIN,
            methods: ["GET", "POST"],
            credentials: true,
        },
        path: "/socket.io",
    });

    /**
     * @middleware Authentication
     * @description Verifies the JWT token sent in the handshake auth payload.
     */
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.token;

        if (!token) {
            return next(new Error("Authentication error: Token not provided"));
        }

        try {
            const decoded = jwt.verify(token, ENV_CONFIG.ACCESS_TOKEN.SECRET);
            // Attach user info to the socket instance for future use
            socket.data.user = decoded;
            next();
        } catch (error) {
            Logger.error(`Socket authentication failed: ${error instanceof Error ? error.message : String(error)}`);
            next(new Error("Authentication error: Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        Logger.info(`New client connected: ${socket.id} (User: ${socket.data.user?.id})`);
        socket.on("disconnect", () => {
            Logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    Logger.log("Socket.io initialized successfully.");
};