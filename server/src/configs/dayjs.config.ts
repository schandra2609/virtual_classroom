/**
 * @file dayjs.config.ts
 * @module Config/DateTime
 * @description A centralized configuration for the Day.js library. 
 * This setup ensures that the entire application handles time consistently,
 * particularly for classroom schedules, token expirations, and audit logs.
 * @author Sayan Chandra
 */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

/** 
 * Extend dayjs with essential plugins:
 * - **UTC**: Handles coordinates-neutral time formats.
 * - **Timezone**: Enables shifting between local and server time.
 */
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @constant dayjs
 * @description Standardized Day.js instance with a forced default timezone.
 * Setting the default to 'Asia/Kolkata' prevents "Time Drift" issues where 
 * the server's hardware clock (often UTC) differs from the users' local time.
 */
dayjs.tz.setDefault("Asia/Kolkata" as const);

export { dayjs };