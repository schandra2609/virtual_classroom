import express from "express";
import type { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import { configureGoogleStrategy } from "./configs/passport.config.ts";
import { globalErrorHandler } from "./middlewares/error.middleware.ts";

import rootRouter from "./routes/root.routes.ts";
import { ENV_CONFIG } from "./configs/env.config.ts";

const app: Application = express();

if(ENV_CONFIG.NODE_ENV === "production") {
    app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

app.use(passport.initialize());
configureGoogleStrategy(passport);

app.use(`${ENV_CONFIG.API_V}`, rootRouter);


app.use(globalErrorHandler);

export default app;