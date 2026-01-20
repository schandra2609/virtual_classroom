import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import { configureGoogleStrategy } from "./configs/passport.config.ts";
import { globalErrorHandler } from "./middlewares/error.middleware.ts";


const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

app.use(passport.initialize());
configureGoogleStrategy(passport);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Virtual Classroom API is running"
    });
});

app.use(globalErrorHandler);

export default app;