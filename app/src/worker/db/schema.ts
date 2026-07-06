import {
	index,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
	uniqueIndex,
	type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

// 設計の全体像は docs/db_schema.md を参照

//--------------------------------------------------
// アカウント系（users/sessions/accounts/verificationsはbetter-authが利用する）
//--------------------------------------------------

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	// ニックネーム 実名は取得しない
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	image: text("image"),
	role: text("role", { enum: ["student", "teacher", "admin"] })
		.notNull()
		.default("student"),
	// 評価データセットへの答案提供に同意しているか
	// 既定はオフで規約への同意とは別に取得する
	researchOptIn: integer("research_opt_in", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const accounts = sqliteTable("accounts", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verifications", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }),
	updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// 組織（塾・学校）
export const organizations = sqliteTable("organizations", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	kind: text("kind", { enum: ["juku", "school", "community", "other"] })
		.notNull()
		.default("juku"),
	plan: text("plan").notNull().default("free"),
	// NULLならプラン既定値を使う
	gradingQuotaMonthly: integer("grading_quota_monthly"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// 所属（ユーザーと組織の多対多）
export const memberships = sqliteTable(
	"memberships",
	{
		id: text("id").primaryKey(),
		orgId: text("org_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text("role", { enum: ["student", "teacher", "org_admin"] })
			.notNull()
			.default("student"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(t) => [uniqueIndex("uq_memberships_org_user").on(t.orgId, t.userId), index("idx_memberships_user").on(t.userId)],
);

// クラス・講座
// フェーズ2で利用する器だけ先行して用意
export const groups = sqliteTable("groups", {
	id: text("id").primaryKey(),
	orgId: text("org_id")
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const groupMembers = sqliteTable(
	"group_members",
	{
		groupId: text("group_id")
			.notNull()
			.references(() => groups.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.groupId, t.userId] })],
);

// 同意の記録（利用規約・プライバシーポリシー・保護者同意・評価データ提供）
// 規約改定のたびにversionを上げて再同意を取る
export const userConsents = sqliteTable(
	"user_consents",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		kind: text("kind", { enum: ["tos", "privacy", "parental", "research"] }).notNull(),
		version: text("version").notNull(),
		grantedAt: integer("granted_at", { mode: "timestamp" }).notNull(),
		revokedAt: integer("revoked_at", { mode: "timestamp" }),
	},
	(t) => [uniqueIndex("uq_user_consents").on(t.userId, t.kind, t.version)],
);

//--------------------------------------------------
// コンテンツ系
//--------------------------------------------------

// 問題バンク（Gitリポジトリから同期される派生データ）
export const problems = sqliteTable(
	"problems",
	{
		id: text("id").primaryKey(),
		// 同期のUPSERTキーとURLに使う人間可読な識別子
		slug: text("slug").notNull().unique(),
		title: text("title").notNull(),
		// 10段階（1が教科書例題レベル）
		difficulty: integer("difficulty").notNull(),
		// KaTeXで描画できる形で格納する
		statementTex: text("statement_tex").notNull(),
		answerTex: text("answer_tex"),
		explanationTex: text("explanation_tex"),
		// 採点基準（AI添削プロンプトに注入する）
		// 生徒には見せない
		gradingNotes: text("grading_notes"),
		// 自作・典型問題はCC BY-SAで他者著作物の引用はquoted
		license: text("license", { enum: ["CC-BY-SA-4.0", "quoted"] })
			.notNull()
			.default("CC-BY-SA-4.0"),
		source: text("source").notNull(),
		// 引用問題の出典表示
		attribution: text("attribution"),
		status: text("status", { enum: ["draft", "published", "archived"] })
			.notNull()
			.default("draft"),
		// 同期スクリプトの差分検出用
		contentHash: text("content_hash"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	},
	(t) => [index("idx_problems_status").on(t.status)],
);

// タグ（単元タグ + その下の項目タグ）
// kind = unit の行が単元別演習のナビゲーションになる
// kind = topic の行は parent_id で単元にぶら下がる
// 例 数I > 数と式（unit） > 因数分解（topic）
export const tags = sqliteTable("tags", {
	id: text("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	name: text("name").notNull().unique(),
	kind: text("kind", { enum: ["unit", "topic"] })
		.notNull()
		.default("unit"),
	// 親タグ（topicのとき所属する単元）
	parentId: text("parent_id").references((): AnySQLiteColumn => tags.id, { onDelete: "set null" }),
	// kind = unit のとき 数I 数A など
	subject: text("subject"),
	sortOrder: integer("sort_order"),
});

export const problemTags = sqliteTable(
	"problem_tags",
	{
		problemId: text("problem_id")
			.notNull()
			.references(() => problems.id, { onDelete: "cascade" }),
		tagId: text("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.problemId, t.tagId] }), index("idx_problem_tags_tag").on(t.tagId)],
);

// 問題セット（公式の単元別演習も塾の自作課題もこれで表現する）
export const problemSets = sqliteTable("problem_sets", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description"),
	// NULLなら公式セット（全体公開）
	orgId: text("org_id").references(() => organizations.id, { onDelete: "cascade" }),
	createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const problemSetItems = sqliteTable(
	"problem_set_items",
	{
		setId: text("set_id")
			.notNull()
			.references(() => problemSets.id, { onDelete: "cascade" }),
		problemId: text("problem_id")
			.notNull()
			.references(() => problems.id, { onDelete: "cascade" }),
		sortOrder: integer("sort_order").notNull(),
	},
	(t) => [primaryKey({ columns: [t.setId, t.problemId] })],
);

//--------------------------------------------------
// 添削系
//--------------------------------------------------

// 答案の提出
export const submissions = sqliteTable(
	"submissions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		problemId: text("problem_id")
			.notNull()
			.references(() => problems.id),
		// 提出時にどの組織の文脈だったか（個人利用はNULL）
		orgId: text("org_id").references(() => organizations.id, { onDelete: "set null" }),
		status: text("status", { enum: ["uploaded", "queued", "grading", "graded", "failed"] })
			.notNull()
			.default("uploaded"),
		// 依頼時に生徒が添えるメッセージ（添削の観点の希望など）
		// AI添削プロンプトに注入する
		studentMessage: text("student_message"),
		// 添削ジョブの試行回数（Queueのリトライ管理）
		attemptCount: integer("attempt_count").notNull().default(0),
		lastError: text("last_error"),
		// R2画像を削除した時刻（保持期間経過後にクリーンアップジョブが記録）
		imagesDeletedAt: integer("images_deleted_at", { mode: "timestamp" }),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		gradedAt: integer("graded_at", { mode: "timestamp" }),
	},
	(t) => [
		index("idx_submissions_user").on(t.userId, t.createdAt),
		index("idx_submissions_org").on(t.orgId, t.createdAt),
		index("idx_submissions_status").on(t.status),
	],
);

// 答案画像（複数ページ対応）
export const submissionImages = sqliteTable(
	"submission_images",
	{
		id: text("id").primaryKey(),
		submissionId: text("submission_id")
			.notNull()
			.references(() => submissions.id, { onDelete: "cascade" }),
		r2Key: text("r2_key").notNull(),
		pageNo: integer("page_no").notNull().default(1),
		contentType: text("content_type").notNull(),
		sizeBytes: integer("size_bytes"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(t) => [index("idx_submission_images_sub").on(t.submissionId)],
);

// 添削結果（追記型）
// 同一submission内でcreated_atが最新の行を有効な添削とみなす
export const gradings = sqliteTable(
	"gradings",
	{
		id: text("id").primaryKey(),
		submissionId: text("submission_id")
			.notNull()
			.references(() => submissions.id, { onDelete: "cascade" }),
		graderType: text("grader_type", { enum: ["ai", "human"] }).notNull(),
		// grader_type = human のとき添削した先生
		graderUserId: text("grader_user_id").references(() => users.id, { onDelete: "set null" }),
		// 品質計測（評価セットの回帰テスト）と突合するためモデルとプロンプトの版を残す
		model: text("model"),
		promptVersion: text("prompt_version"),
		verdict: text("verdict", {
			enum: ["correct", "partially_correct", "incorrect", "cannot_judge", "unreadable"],
		}).notNull(),
		// 0.0-1.0
		// 低い添削は先生のレビューキューに出す（フェーズ2）
		confidence: real("confidence"),
		feedbackJson: text("feedback_json").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(t) => [index("idx_gradings_submission").on(t.submissionId, t.createdAt)],
);

// 自己採点ログ（添削を使わない演習の学習履歴）
export const selfChecks = sqliteTable(
	"self_checks",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		problemId: text("problem_id")
			.notNull()
			.references(() => problems.id),
		result: text("result", { enum: ["correct", "partial", "wrong"] }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(t) => [index("idx_self_checks_user").on(t.userId, t.createdAt)],
);

// 日次利用量（無料枠の制御）
export const usageDaily = sqliteTable(
	"usage_daily",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		day: text("day").notNull(),
		gradings: integer("gradings").notNull().default(0),
	},
	(t) => [primaryKey({ columns: [t.userId, t.day] })],
);
