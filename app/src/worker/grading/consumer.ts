import Anthropic from "@anthropic-ai/sdk";
import { asc, eq, sql } from "drizzle-orm";
import { Buffer } from "node:buffer";
import { getDb, type Db } from "../db/client";
import { gradings, problems, submissionImages, submissions } from "../db/schema";
import { uuidv7 } from "../lib/id";
import { GRADING_OUTPUT_SCHEMA, type GradingOutput } from "./feedback";
import { buildGradingUserText, GRADING_SYSTEM_PROMPT, PROMPT_VERSION } from "./prompt";

const MAX_ATTEMPTS = 3;

export async function handleGradingBatch(batch: MessageBatch<GradingJob>, env: Env): Promise<void> {
	for (const message of batch.messages) {
		const db = getDb(env);
		const submissionId = message.body.submissionId;
		try {
			await gradeSubmission(db, env, submissionId);
			message.ack();
		} catch (err) {
			console.error(`grading failed submission=${submissionId} attempt=${message.attempts}`, err);
			const failedForGood = message.attempts >= MAX_ATTEMPTS;
			await db
				.update(submissions)
				.set({
					attemptCount: sql`${submissions.attemptCount} + 1`,
					lastError: String(err).slice(0, 2000),
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
				media_type: image.contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
				data,
			},
		});
	}

	const model = env.GRADING_MODEL || "claude-opus-4-8";
	const { output, usedModel } = env.ANTHROPIC_API_KEY
		? await callClaude(env.ANTHROPIC_API_KEY, model, imageBlocks, problem)
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

async function callClaude(
	apiKey: string,
	model: string,
	imageBlocks: Anthropic.ImageBlockParam[],
	problem: Parameters<typeof buildGradingUserText>[0],
): Promise<{ output: GradingOutput; usedModel: string }> {
	const client = new Anthropic({ apiKey });
	const response = await client.messages.create({
		model,
		max_tokens: 16000,
		thinking: { type: "adaptive" },
		system: GRADING_SYSTEM_PROMPT,
		messages: [
			{
				role: "user",
				content: [...imageBlocks, { type: "text", text: buildGradingUserText(problem) }],
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
