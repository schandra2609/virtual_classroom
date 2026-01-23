/**
 * @file dayjs.config.ts
 * @module Config/DateTime
 * @description Enhances Day.js with necessary plugins for timezone handling and UTC conversions.
 * Essential for scheduling classroom live sessions and handling token expirations.
 */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// Extended dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @constant dayjs
 * @description Standardized Day.js instance with 'Asia/Kolkata' set as the default timezone.
 */
dayjs.tz.setDefault("Asia/Kolkata" as const);

export { dayjs };