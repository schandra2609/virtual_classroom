import express from "express";
import type { Application, Request, Response } from "express"
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
	res.status(200).send({
		success: true,
		message: "Virtual Classroom API is running",
	});
});

export default app;
