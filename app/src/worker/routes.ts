import { and, asc, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { Hono } from 'hono';
import { createAuth, type SessionUser } from './auth';
import { getDb } from './db/client';
import {
	gradings,
	problems,
	problemTags,
	selfChecks,
	submissionImages,
	submissions,
	tags,
	usageDaily,
	userConsents,
} from './db/schema';
import { uuidv7 } from './lib/id';
import { jstDay } from './lib/time';

// 利用規約・プライバシーポリシーの版
// 改定したらここを上げて再同意を取る
const TERMS_VERSION = '2026-07-06';

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_MESSAGE_LENGTH = 500;

type Variables = {
	user: SessionUser | null;
};

export const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// better-authのエンドポイント
app.on(['GET', 'POST'], '/api/auth/*', (c) => {
	const auth = createAuth(c.env, new URL(c.req.url).origin);
	return auth.handler(c.req.raw);
});

// セッション解決
app.use('/api/*', async (c, next) => {
	const auth = createAuth(c.env, new URL(c.req.url).origin);
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	c.set('user', session?.user ?? null);
	await next();
});

function requireUser(c: { get: (key: 'user') => SessionUser | null }): SessionUser {
	const user = c.get('user');
	if (!user) {
		throw new AuthError();
	}
	return user;
}

// 問題の作成・編集ができる承認済みロール
const EDITOR_ROLES: string[] = ['teacher', 'admin'];

function getUserRole(user: SessionUser): string {
	return (user as { role?: string }).role ?? 'student';
}

function requireEditor(c: { get: (key: 'user') => SessionUser | null }): SessionUser {
	const user = requireUser(c);
	if (!EDITOR_ROLES.includes(getUserRole(user))) {
		throw new ForbiddenError();
	}
	return user;
}

class AuthError extends Error {}
class ForbiddenError extends Error {}

app.onError((err, c) => {
	if (err instanceof AuthError) {
		return c.json({ error: 'ログインが必要です' }, 401);
	}
	if (err instanceof ForbiddenError) {
		return c.json({ error: 'この操作を行う権限がありません' }, 403);
	}
	console.error(err);
	return c.json({ error: 'サーバーエラーが発生しました' }, 500);
});

//--------------------------------------------------
// アカウント
//--------------------------------------------------

app.get('/api/me', async (c) => {
	const user = c.get('user');
	if (!user) {
		return c.json({ user: null });
	}
	const db = getDb(c.env);
	const limit = Number.parseInt(c.env.FREE_DAILY_GRADINGS, 10) || 3;
	const usage = await db.query.usageDaily.findFirst({
		where: and(eq(usageDaily.userId, user.id), eq(usageDaily.day, jstDay())),
	});
	return c.json({
		user: { id: user.id, name: user.name, email: user.email, role: getUserRole(user) },
		usage: { used: usage?.gradings ?? 0, limit },
	});
});

app.post('/api/consents', async (c) => {
	const user = requireUser(c);
	const body = await c.req.json<{ kinds?: string[] }>();
	const kinds = (body.kinds ?? []).filter((k): k is 'tos' | 'privacy' | 'parental' | 'research' =>
		['tos', 'privacy', 'parental', 'research'].includes(k),
	);
	if (kinds.length === 0) {
		return c.json({ error: 'kindsが不正です' }, 400);
	}
	const db = getDb(c.env);
	const now = new Date();
	for (const kind of kinds) {
		await db
			.insert(userConsents)
			.values({ id: uuidv7(), userId: user.id, kind, version: TERMS_VERSION, grantedAt: now })
			.onConflictDoNothing();
	}
	return c.json({ ok: true });
});

//--------------------------------------------------
// コンテンツ
//--------------------------------------------------

app.get('/api/units', async (c) => {
	const db = getDb(c.env);
	// 単元直下の問題と配下の項目に付いた問題をまとめて数える
	const unitOrTopic = alias(tags, 'unit_or_topic');
	const rows = await db
		.select({
			slug: tags.slug,
			name: tags.name,
			subject: tags.subject,
			problemCount: sql<number>`count(distinct ${problems.id})`,
		})
		.from(tags)
		.leftJoin(unitOrTopic, or(eq(unitOrTopic.id, tags.id), eq(unitOrTopic.parentId, tags.id)))
		.leftJoin(problemTags, eq(problemTags.tagId, unitOrTopic.id))
		.leftJoin(problems, and(eq(problems.id, problemTags.problemId), eq(problems.status, 'published')))
		.where(and(eq(tags.kind, 'unit'), isNull(tags.parentId)))
		.groupBy(tags.id)
		.orderBy(asc(tags.sortOrder));
	return c.json({ units: rows });
});

app.get('/api/units/:slug', async (c) => {
	const db = getDb(c.env);
	const unit = await db.query.tags.findFirst({
		where: and(eq(tags.slug, c.req.param('slug')), eq(tags.kind, 'unit')),
	});
	if (!unit) {
		return c.json({ error: '単元が見つかりません' }, 404);
	}
	const rows = await db
		.select({
			slug: problems.slug,
			title: problems.title,
			difficulty: problems.difficulty,
			topicSlug: tags.slug,
			topicName: tags.name,
		})
		.from(problemTags)
		.innerJoin(tags, and(eq(tags.id, problemTags.tagId), or(eq(tags.id, unit.id), eq(tags.parentId, unit.id))))
		.innerJoin(problems, and(eq(problems.id, problemTags.problemId), eq(problems.status, 'published')))
		.orderBy(asc(tags.sortOrder), asc(problems.difficulty), asc(problems.slug));

	// 項目ごとにまとめる
	// 単元タグ直付けの問題はtopicなし扱い
	const groupMap = new Map<
		string,
		{ topic: { slug: string; name: string } | null; problems: { slug: string; title: string; difficulty: number }[] }
	>();
	for (const row of rows) {
		const isDirect = row.topicSlug === unit.slug;
		const key = isDirect ? '' : row.topicSlug;
		if (!groupMap.has(key)) {
			groupMap.set(key, {
				topic: isDirect ? null : { slug: row.topicSlug, name: row.topicName },
				problems: [],
			});
		}
		groupMap.get(key)!.problems.push({ slug: row.slug, title: row.title, difficulty: row.difficulty });
	}
	return c.json({
		unit: { slug: unit.slug, name: unit.name, subject: unit.subject },
		groups: [...groupMap.values()],
	});
});

app.get('/api/problems/:slug', async (c) => {
	const db = getDb(c.env);
	const problem = await db.query.problems.findFirst({
		where: and(eq(problems.slug, c.req.param('slug')), eq(problems.status, 'published')),
	});
	if (!problem) {
		return c.json({ error: '問題が見つかりません' }, 404);
	}
	const parent = alias(tags, 'parent');
	const tagRows = await db
		.select({
			slug: tags.slug,
			name: tags.name,
			kind: tags.kind,
			parentSlug: parent.slug,
			parentName: parent.name,
		})
		.from(problemTags)
		.innerJoin(tags, eq(tags.id, problemTags.tagId))
		.leftJoin(parent, eq(parent.id, tags.parentId))
		.where(eq(problemTags.problemId, problem.id));
	return c.json({
		problem: {
			slug: problem.slug,
			title: problem.title,
			difficulty: problem.difficulty,
			statementTex: problem.statementTex,
			answerTex: problem.answerTex,
			explanationTex: problem.explanationTex,
			license: problem.license,
			attribution: problem.attribution,
			tags: tagRows.map((t) => ({
				slug: t.slug,
				name: t.name,
				kind: t.kind,
				parent: t.parentSlug && t.parentName ? { slug: t.parentSlug, name: t.parentName } : null,
			})),
		},
	});
});

//--------------------------------------------------
// 添削
//--------------------------------------------------

app.post('/api/problems/:slug/submissions', async (c) => {
	const user = requireUser(c);
	const db = getDb(c.env);

	const problem = await db.query.problems.findFirst({
		where: and(eq(problems.slug, c.req.param('slug')), eq(problems.status, 'published')),
	});
	if (!problem) {
		return c.json({ error: '問題が見つかりません' }, 404);
	}

	// 無料枠のチェック
	const limit = Number.parseInt(c.env.FREE_DAILY_GRADINGS, 10) || 3;
	const day = jstDay();
	const usage = await db.query.usageDaily.findFirst({
		where: and(eq(usageDaily.userId, user.id), eq(usageDaily.day, day)),
	});
	if ((usage?.gradings ?? 0) >= limit) {
		return c.json({ error: `本日の添削回数の上限（${limit}回）に達しました。また明日利用できます` }, 429);
	}

	const form = await c.req.formData();
	const files = form.getAll('images').filter((f): f is File => f instanceof File);
	const messageRaw = form.get('message');
	const message = typeof messageRaw === 'string' ? messageRaw.trim() : '';
	if (message.length > MAX_MESSAGE_LENGTH) {
		return c.json({ error: `メッセージは${MAX_MESSAGE_LENGTH}文字までです` }, 400);
	}
	if (files.length === 0) {
		return c.json({ error: '答案の画像を選択してください' }, 400);
	}
	if (files.length > MAX_IMAGES) {
		return c.json({ error: `画像は${MAX_IMAGES}枚までです` }, 400);
	}
	for (const file of files) {
		if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
			return c.json({ error: 'JPEG・PNG・WebP・GIF形式の画像のみアップロードできます' }, 400);
		}
		if (file.size > MAX_IMAGE_BYTES) {
			return c.json({ error: '画像1枚のサイズは8MBまでです' }, 400);
		}
	}

	const submissionId = uuidv7();
	const now = new Date();

	const imageRows = [];
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const ext = file.type.split('/')[1] ?? 'bin';
		const key = `answers/${user.id}/${submissionId}/${i + 1}.${ext}`;
		await c.env.ANSWERS.put(key, file, { httpMetadata: { contentType: file.type } });
		imageRows.push({
			id: uuidv7(),
			submissionId,
			r2Key: key,
			pageNo: i + 1,
			contentType: file.type,
			sizeBytes: file.size,
			createdAt: now,
		});
	}

	await db.insert(submissions).values({
		id: submissionId,
		userId: user.id,
		problemId: problem.id,
		status: 'queued',
		studentMessage: message || null,
		createdAt: now,
	});
	await db.insert(submissionImages).values(imageRows);
	await db
		.insert(usageDaily)
		.values({ userId: user.id, day, gradings: 1 })
		.onConflictDoUpdate({
			target: [usageDaily.userId, usageDaily.day],
			set: { gradings: sql`${usageDaily.gradings} + 1` },
		});

	await c.env.GRADING_QUEUE.send({ submissionId });

	return c.json({ id: submissionId }, 201);
});

// 問題ページのフィード（本人の添削依頼と学習記録を時系列で返す）
app.get('/api/problems/:slug/activity', async (c) => {
	const user = requireUser(c);
	const db = getDb(c.env);
	const problem = await db.query.problems.findFirst({
		where: and(eq(problems.slug, c.req.param('slug')), eq(problems.status, 'published')),
	});
	if (!problem) {
		return c.json({ error: '問題が見つかりません' }, 404);
	}
	// JOINのない単一テーブルselectではdrizzleが列名を修飾しないため
	// サブクエリ内で列があいまいにならないようテーブル名を明示する
	const submissionRows = await db
		.select({
			id: submissions.id,
			status: submissions.status,
			message: submissions.studentMessage,
			createdAt: submissions.createdAt,
			verdict: sql<
				string | null
			>`(select verdict from gradings g where g.submission_id = "submissions"."id" order by g.created_at desc limit 1)`,
		})
		.from(submissions)
		.where(and(eq(submissions.userId, user.id), eq(submissions.problemId, problem.id)))
		.orderBy(asc(submissions.createdAt));
	// idはUUIDv7なので同時刻の記録も生成順に並ぶ
	const checkRows = await db.query.selfChecks.findMany({
		where: and(eq(selfChecks.userId, user.id), eq(selfChecks.problemId, problem.id)),
		orderBy: [asc(selfChecks.createdAt), asc(selfChecks.id)],
	});
	const items = [
		...submissionRows.map((s) => ({
			type: 'submission' as const,
			id: s.id,
			status: s.status,
			verdict: s.verdict,
			message: s.message,
			createdAt: s.createdAt,
		})),
		// 何回目の記録かは同一問題内の通し番号
		...checkRows.map((sc, i) => ({
			type: 'self_check' as const,
			id: sc.id,
			result: sc.result,
			attemptNo: i + 1,
			createdAt: sc.createdAt,
		})),
	].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
	return c.json({ items });
});

// 学習記録（⚪︎△×の自己採点）
app.post('/api/problems/:slug/self-checks', async (c) => {
	const user = requireUser(c);
	const db = getDb(c.env);
	const problem = await db.query.problems.findFirst({
		where: and(eq(problems.slug, c.req.param('slug')), eq(problems.status, 'published')),
	});
	if (!problem) {
		return c.json({ error: '問題が見つかりません' }, 404);
	}
	const body = await c.req.json<{ result?: string }>();
	if (body.result !== 'correct' && body.result !== 'partial' && body.result !== 'wrong') {
		return c.json({ error: 'resultが不正です' }, 400);
	}
	await db.insert(selfChecks).values({
		id: uuidv7(),
		userId: user.id,
		problemId: problem.id,
		result: body.result,
		createdAt: new Date(),
	});
	return c.json({ ok: true }, 201);
});

app.get('/api/submissions', async (c) => {
	const user = requireUser(c);
	const db = getDb(c.env);
	const rows = await db
		.select({
			id: submissions.id,
			status: submissions.status,
			createdAt: submissions.createdAt,
			problemSlug: problems.slug,
			problemTitle: problems.title,
			verdict: sql<
				string | null
			>`(select verdict from gradings g where g.submission_id = ${submissions.id} order by g.created_at desc limit 1)`,
		})
		.from(submissions)
		.innerJoin(problems, eq(problems.id, submissions.problemId))
		.where(eq(submissions.userId, user.id))
		.orderBy(desc(submissions.createdAt))
		.limit(50);
	return c.json({ submissions: rows });
});

app.get('/api/submissions/:id', async (c) => {
	const user = requireUser(c);
	const db = getDb(c.env);
	const submission = await db.query.submissions.findFirst({
		where: and(eq(submissions.id, c.req.param('id')), eq(submissions.userId, user.id)),
	});
	if (!submission) {
		return c.json({ error: '提出が見つかりません' }, 404);
	}
	const problem = await db.query.problems.findFirst({
		where: eq(problems.id, submission.problemId),
	});
	const images = await db.query.submissionImages.findMany({
		where: eq(submissionImages.submissionId, submission.id),
		orderBy: [asc(submissionImages.pageNo)],
	});
	const grading = await db.query.gradings.findFirst({
		where: eq(gradings.submissionId, submission.id),
		orderBy: [desc(gradings.createdAt)],
	});
	return c.json({
		submission: {
			id: submission.id,
			status: submission.status,
			createdAt: submission.createdAt,
			studentMessage: submission.studentMessage,
			problem: problem ? { slug: problem.slug, title: problem.title, statementTex: problem.statementTex } : null,
			images: images.map((img) => ({ id: img.id, pageNo: img.pageNo })),
			grading: grading
				? {
						graderType: grading.graderType,
						model: grading.model,
						verdict: grading.verdict,
						confidence: grading.confidence,
						feedback: JSON.parse(grading.feedbackJson) as unknown,
						createdAt: grading.createdAt,
					}
				: null,
		},
	});
});

app.get('/api/submissions/:id/images/:imageId', async (c) => {
	const user = requireUser(c);
	const db = getDb(c.env);
	const submission = await db.query.submissions.findFirst({
		where: and(eq(submissions.id, c.req.param('id')), eq(submissions.userId, user.id)),
	});
	if (!submission) {
		return c.json({ error: '提出が見つかりません' }, 404);
	}
	const image = await db.query.submissionImages.findFirst({
		where: and(eq(submissionImages.id, c.req.param('imageId')), eq(submissionImages.submissionId, submission.id)),
	});
	if (!image) {
		return c.json({ error: '画像が見つかりません' }, 404);
	}
	const object = await c.env.ANSWERS.get(image.r2Key);
	if (!object) {
		return c.json({ error: '画像は保持期間を過ぎて削除されました' }, 410);
	}
	return new Response(object.body, {
		headers: {
			'Content-Type': image.contentType,
			'Cache-Control': 'private, max-age=300',
		},
	});
});

//--------------------------------------------------
// 問題管理（承認済みユーザー = teacher / admin）
//--------------------------------------------------

interface ProblemInput {
	slug?: string;
	title?: string;
	difficulty?: number;
	statementTex?: string;
	answerTex?: string | null;
	explanationTex?: string | null;
	gradingNotes?: string | null;
	status?: string;
	tagSlugs?: string[];
}

function validateProblemInput(body: ProblemInput, opts: { requireSlug: boolean }): string | null {
	if (opts.requireSlug && !/^[a-z0-9][a-z0-9-]*$/.test(body.slug ?? '')) {
		return 'slugは半角英小文字・数字・ハイフンで入力してください';
	}
	if (!body.title?.trim()) {
		return 'タイトルを入力してください';
	}
	if (!Number.isInteger(body.difficulty) || body.difficulty! < 1 || body.difficulty! > 10) {
		return '難易度は1〜10の整数で入力してください';
	}
	if (!body.statementTex?.trim()) {
		return '問題文を入力してください';
	}
	if (body.status !== 'draft' && body.status !== 'published') {
		return 'statusが不正です';
	}
	if (!Array.isArray(body.tagSlugs) || body.tagSlugs.length === 0) {
		return 'タグを1つ以上選択してください';
	}
	return null;
}

async function resolveTagIds(db: ReturnType<typeof getDb>, tagSlugs: string[]): Promise<string[] | null> {
	const rows = await db.select({ id: tags.id, slug: tags.slug }).from(tags).where(inArray(tags.slug, tagSlugs));
	if (rows.length !== new Set(tagSlugs).size) {
		return null;
	}
	return rows.map((r) => r.id);
}

app.get('/api/admin/tags', async (c) => {
	requireEditor(c);
	const db = getDb(c.env);
	const parent = alias(tags, 'parent');
	const rows = await db
		.select({
			slug: tags.slug,
			name: tags.name,
			kind: tags.kind,
			subject: tags.subject,
			parentSlug: parent.slug,
			parentName: parent.name,
		})
		.from(tags)
		.leftJoin(parent, eq(parent.id, tags.parentId))
		.orderBy(asc(tags.sortOrder), asc(tags.slug));
	return c.json({ tags: rows });
});

app.get('/api/admin/problems', async (c) => {
	requireEditor(c);
	const db = getDb(c.env);
	const rows = await db
		.select({
			slug: problems.slug,
			title: problems.title,
			difficulty: problems.difficulty,
			status: problems.status,
			updatedAt: problems.updatedAt,
		})
		.from(problems)
		.orderBy(desc(problems.updatedAt))
		.limit(200);
	return c.json({ problems: rows });
});

app.get('/api/admin/problems/:slug', async (c) => {
	requireEditor(c);
	const db = getDb(c.env);
	const problem = await db.query.problems.findFirst({ where: eq(problems.slug, c.req.param('slug')) });
	if (!problem) {
		return c.json({ error: '問題が見つかりません' }, 404);
	}
	const tagRows = await db
		.select({ slug: tags.slug })
		.from(problemTags)
		.innerJoin(tags, eq(tags.id, problemTags.tagId))
		.where(eq(problemTags.problemId, problem.id));
	return c.json({
		problem: {
			slug: problem.slug,
			title: problem.title,
			difficulty: problem.difficulty,
			statementTex: problem.statementTex,
			answerTex: problem.answerTex,
			explanationTex: problem.explanationTex,
			gradingNotes: problem.gradingNotes,
			status: problem.status,
			tagSlugs: tagRows.map((r) => r.slug),
		},
	});
});

app.post('/api/admin/problems', async (c) => {
	requireEditor(c);
	const db = getDb(c.env);
	const body = await c.req.json<ProblemInput>();
	const invalid = validateProblemInput(body, { requireSlug: true });
	if (invalid) {
		return c.json({ error: invalid }, 400);
	}
	const existing = await db.query.problems.findFirst({ where: eq(problems.slug, body.slug!) });
	if (existing) {
		return c.json({ error: 'このslugはすでに使われています' }, 409);
	}
	const tagIds = await resolveTagIds(db, body.tagSlugs!);
	if (!tagIds) {
		return c.json({ error: '存在しないタグが含まれています' }, 400);
	}
	const now = new Date();
	const problemId = uuidv7();
	await db.insert(problems).values({
		id: problemId,
		slug: body.slug!,
		title: body.title!.trim(),
		difficulty: body.difficulty!,
		statementTex: body.statementTex!,
		answerTex: body.answerTex || null,
		explanationTex: body.explanationTex || null,
		gradingNotes: body.gradingNotes || null,
		status: body.status as 'draft' | 'published',
		license: 'CC-BY-SA-4.0',
		source: 'original',
		createdAt: now,
		updatedAt: now,
	});
	await db.insert(problemTags).values(tagIds.map((tagId) => ({ problemId, tagId })));
	return c.json({ slug: body.slug }, 201);
});

app.put('/api/admin/problems/:slug', async (c) => {
	requireEditor(c);
	const db = getDb(c.env);
	const body = await c.req.json<ProblemInput>();
	const invalid = validateProblemInput(body, { requireSlug: false });
	if (invalid) {
		return c.json({ error: invalid }, 400);
	}
	const problem = await db.query.problems.findFirst({ where: eq(problems.slug, c.req.param('slug')) });
	if (!problem) {
		return c.json({ error: '問題が見つかりません' }, 404);
	}
	const tagIds = await resolveTagIds(db, body.tagSlugs!);
	if (!tagIds) {
		return c.json({ error: '存在しないタグが含まれています' }, 400);
	}
	await db
		.update(problems)
		.set({
			title: body.title!.trim(),
			difficulty: body.difficulty!,
			statementTex: body.statementTex!,
			answerTex: body.answerTex || null,
			explanationTex: body.explanationTex || null,
			gradingNotes: body.gradingNotes || null,
			status: body.status as 'draft' | 'published',
			updatedAt: new Date(),
		})
		.where(eq(problems.id, problem.id));
	await db.delete(problemTags).where(eq(problemTags.problemId, problem.id));
	await db.insert(problemTags).values(tagIds.map((tagId) => ({ problemId: problem.id, tagId })));
	return c.json({ ok: true });
});
