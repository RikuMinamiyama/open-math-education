import { handleGradingBatch } from "./grading/consumer";
import { app } from "./routes";

export default {
	fetch: app.fetch,
	queue: handleGradingBatch,
} satisfies ExportedHandler<Env, GradingJob>;
