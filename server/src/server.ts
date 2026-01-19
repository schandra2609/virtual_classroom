import app from "./app.ts";
import { ENV_CONFIG } from "./configs/env.config.ts";

app.listen(ENV_CONFIG.PORT, () => {
	console.log(`🚀 Server running in ${ENV_CONFIG.NODE_ENV} mode on port ${ENV_CONFIG.PORT}`);
});