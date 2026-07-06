interface Env {
	DB: D1Database;
	ANSWERS: R2Bucket;
	GRADING_QUEUE: Queue<GradingJob>;
	AUTH_SECRET: string;
	ANTHROPIC_API_KEY?: string;
	FREE_DAILY_GRADINGS: string;
	GRADING_MODEL: string;
}

// 添削キューのメッセージ
interface GradingJob {
	submissionId: string;
}
