import app from "./app.ts";
import { config } from "dotenv";
import path from "path";

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
config({ path: path.resolve(process.cwd(), envFile) });

app.listen(process.env.PORT || 5500, () => {
	console.log(`Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
});
