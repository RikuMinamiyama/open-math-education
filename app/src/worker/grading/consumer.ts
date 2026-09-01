import Anthropic from "@anthropic-ai/sdk";
import { asc, eq, sql } from "drizzle-orm";
import { Buffer } from "node:buffer";
import { getDb, type Db } from "../db/client";
import { gradings, problems, submissionImages, submissions } from "../db/schema";
import { uuidv7 } from "../lib/id";
import { GRADING_OUTPUT_SCHEMA, type GradingOutput } from "./feedback";
import { buildGradingUserText, GRADING_SYSTEM_PROMPT, PROMPT_VERSION } from "./prompt";

const MAX_ATTEMPTS = 3;
const FALLBACK_MODEL = "claude-sonnet-5";

export async function handleGradingBatch(batch: MessageBatch<GradingJob>, env: Env): Promise<void> {
	for (const message of batch.messages) {
		const db = getDb(env);
		const submissionId = message.body.submissionId;
		try {
			await gradeSubmission(db, env, submissionId);
			message.ack();
		} catch (err) {
			const detail = formatGradingError(err);
			console.error(`grading failed submission=${submissionId} attempt=${message.attempts} ${detail}`);
			const failedForGood = message.attempts >= MAX_ATTEMPTS;
			await db
				.update(submissions)
				.set({
					attemptCount: sql`${submissions.attemptCount} + 1`,
					lastError: detail.slice(0, 2000),
					...(failedForGood ? { status: "failed" as const } : {}),
				})
				.where(eq(submissions.id, submissionId));
			if (failedForGood) {
				message.ack();
			} else {
				message.retry({ delaySeconds: 10 * message.attempts });
			}
		}
	}
}

async function gradeSubmission(db: Db, env: Env, submissionId: string): Promise<void> {
	const submission = await db.query.submissions.findFirst({
		where: eq(submissions.id, submissionId),
	});
	if (!submission) {
		console.warn(`submission not found: ${submissionId}`);
		return;
	}
	// リトライで二重添削しない
	if (submission.status === "graded") {
		return;
	}

	const problem = await db.query.problems.findFirst({
		where: eq(problems.id, submission.problemId),
	});
	if (!problem) {
		throw new Error(`problem not found: ${submission.problemId}`);
	}

	const images = await db.query.submissionImages.findMany({
		where: eq(submissionImages.submissionId, submissionId),
		orderBy: [asc(submissionImages.pageNo)],
	});
	if (images.length === 0) {
		throw new Error("no images for submission");
	}

	await db.update(submissions).set({ status: "grading" }).where(eq(submissions.id, submissionId));

	const imageBlocks: Anthropic.ImageBlockParam[] = [];
	for (const image of images) {
		const object = await env.ANSWERS.get(image.r2Key);
		if (!object) {
			throw new Error(`answer image not found in R2: ${image.r2Key}`);
		}
		const data = Buffer.from(await object.arrayBuffer()).toString("base64");
		imageBlocks.push({
			type: "image",
			source: {
				type: "base64",
				media_type: toImageMediaType(image.contentType),
				data,
			},
		});
	}

	const model = env.GRADING_MODEL || FALLBACK_MODEL;
	const { output, usedModel } = env.ANTHROPIC_API_KEY
		? await callClaudeWithFallback(env.ANTHROPIC_API_KEY, model, imageBlocks, problem, submission.studentMessage)
		: { output: mockGradingOutput(), usedModel: "mock" };

	const now = new Date();
	await db.insert(gradings).values({
		id: uuidv7(),
		submissionId,
		graderType: "ai",
		model: usedModel,
		promptVersion: PROMPT_VERSION,
		verdict: output.verdict,
		confidence: output.confidence,
		feedbackJson: JSON.stringify(output),
		createdAt: now,
	});
	await db
		.update(submissions)
		.set({ status: "graded", gradedAt: now })
		.where(eq(submissions.id, submissionId));
}

async function callClaudeWithFallback(
	apiKey: string,
	model: string,
	imageBlocks: Anthropic.ImageBlockParam[],
	problem: Parameters<typeof buildGradingUserText>[0],
	studentMessage?: string | null,
): Promise<{ output: GradingOutput; usedModel: string }> {
	try {
		return await callClaude(apiKey, model, imageBlocks, problem, studentMessage);
	} catch (err) {
		if (model !== FALLBACK_MODEL && isModelAccessError(err)) {
			console.warn(`grading model ${model} unavailable, falling back to ${FALLBACK_MODEL}: ${formatGradingError(err)}`);
			return await callClaude(apiKey, FALLBACK_MODEL, imageBlocks, problem, studentMessage);
		}
		throw err;
	}
}

async function callClaude(
	apiKey: string,
	model: string,
	imageBlocks: Anthropic.ImageBlockParam[],
	problem: Parameters<typeof buildGradingUserText>[0],
	studentMessage?: string | null,
): Promise<{ output: GradingOutput; usedModel: string }> {
	const client = new Anthropic({ apiKey });
	const response = await client.messages.create({
		model,
		max_tokens: 32000,
		thinking: { type: "adaptive" },
		system: GRADING_SYSTEM_PROMPT,
		messages: [
			{
				role: "user",
				content: [...imageBlocks, { type: "text", text: buildGradingUserText(problem, studentMessage) }],
			},
		],
		output_config: {
			format: {
				type: "json_schema",
				schema: GRADING_OUTPUT_SCHEMA,
			},
		},
	});

	// 安全分類器による拒否は判定不能として扱う
	if (response.stop_reason === "refusal") {
		return {
			output: {
				...mockGradingOutput(),
				verdict: "cannot_judge",
				confidence: 0,
				overall_comment: "システム側の判断により添削できませんでした。別の答案でお試しください",
			},
			usedModel: response.model,
		};
	}

	const text = response.content.find((b) => b.type === "text")?.text;
	if (!text) {
		throw new Error(`empty grading response stop_reason=${response.stop_reason}`);
	}
	return { output: JSON.parse(text) as GradingOutput, usedModel: response.model };
}

function toImageMediaType(contentType: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
	const normalized = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
	if (normalized === "image/png") return "image/png";
	if (normalized === "image/gif") return "image/gif";
	if (normalized === "image/webp") return "image/webp";
	return "image/jpeg";
}

function getErrorStatus(err: unknown): number | undefined {
	if (typeof err === "object" && err !== null && "status" in err) {
		const status = (err as { status?: unknown }).status;
		if (typeof status === "number") return status;
	}
	return undefined;
}

function formatGradingError(err: unknown): string {
	if (typeof err === "object" && err !== null) {
		const status = getErrorStatus(err);
		const rec = err as { error?: { type?: string; message?: string }; message?: string };
		const type = rec.error?.type;
		const message = rec.error?.message || rec.message || String(err);
		return [status != null ? `anthropic ${status}` : "anthropic error", type, message].filter(Boolean).join(": ");
	}
	return String(err);
}

function isModelAccessError(err: unknown): boolean {
	const status = getErrorStatus(err);
	if (status === 403 || status === 404) return true;
	const text = formatGradingError(err).toLowerCase();
	return text.includes("permission_error") || text.includes("you do not have access to model") || text.includes("not_found_error");
}

// APIキー未設定のローカル開発で使うモック
function mockGradingOutput(): GradingOutput {
	return {
		verdict: "partially_correct",
		confidence: 0.5,
		transcription: "（モック添削のため書き起こしなし）",
		steps: [
			{
				page: 1,
				summary: "モックのステップ評価",
				ok: true,
				comment: "ANTHROPIC_API_KEYを設定すると実際のAI添削が動きます",
			},
		],
		errors: [
			{
				location: "（モック）",
				type: "incomplete",
				explanation: "これはモック添削です。実際の答案は評価されていません",
				hint: ".dev.varsにANTHROPIC_API_KEYを設定してください",
			},
		],
		overall_comment: "モック添削の結果です。パイプラインの動作確認用に生成されています",
		next_recommendation: "実際の添削を試すにはAPIキーを設定してください",
	};
}
