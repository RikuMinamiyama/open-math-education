// 添削結果の構造
// docs/db_schema.md の feedback_json フォーマットと同期させる

export type Verdict = "correct" | "partially_correct" | "incorrect" | "cannot_judge" | "unreadable";

export type ErrorType = "calculation" | "logic" | "misconception" | "notation" | "incomplete";

export interface FeedbackStep {
	page: number;
	summary: string;
	ok: boolean;
	comment: string;
}

export interface FeedbackError {
	location: string;
	type: ErrorType;
	explanation: string;
	hint: string;
}

export interface GradingOutput {
	verdict: Verdict;
	confidence: number;
	transcription: string;
	steps: FeedbackStep[];
	errors: FeedbackError[];
	overall_comment: string;
	next_recommendation: string;
}

// Claude APIのstructured outputに渡すJSON Schema
export const GRADING_OUTPUT_SCHEMA = {
	type: "object",
	additionalProperties: false,
	required: ["verdict", "confidence", "transcription", "steps", "errors", "overall_comment", "next_recommendation"],
	properties: {
		verdict: {
			type: "string",
			enum: ["correct", "partially_correct", "incorrect", "cannot_judge", "unreadable"],
			description:
				"答案全体の判定。読み取れない場合はunreadable、判定に確信が持てない場合はcannot_judgeを選ぶこと",
		},
		confidence: {
			type: "number",
			description: "判定の確信度。0.0から1.0の小数",
		},
		transcription: {
			type: "string",
			description: "読み取った答案の書き起こし。数式はKaTeX互換のTeXで $...$ に入れる",
		},
		steps: {
			type: "array",
			description: "答案を論理的なステップに分けた評価",
			items: {
				type: "object",
				additionalProperties: false,
				required: ["page", "summary", "ok", "comment"],
				properties: {
					page: { type: "integer", description: "何枚目の画像か。1始まり" },
					summary: { type: "string", description: "ステップの要約" },
					ok: { type: "boolean", description: "このステップが正しいか" },
					comment: { type: "string", description: "ステップへの短いコメント" },
				},
			},
		},
		errors: {
			type: "array",
			description: "見つかった誤り。正解ならば空配列",
			items: {
				type: "object",
				additionalProperties: false,
				required: ["location", "type", "explanation", "hint"],
				properties: {
					location: { type: "string", description: "誤りがある箇所の答案からの引用" },
					type: {
						type: "string",
						enum: ["calculation", "logic", "misconception", "notation", "incomplete"],
						description:
							"誤りの種類。calculation=計算ミス logic=論理の飛躍や誤り misconception=概念の誤解 notation=記法の誤り incomplete=解答の不足",
					},
					explanation: { type: "string", description: "何がどう誤っているかの説明" },
					hint: { type: "string", description: "答えを直接言わずに正しい方向へ導くヒント" },
				},
			},
		},
		overall_comment: { type: "string", description: "全体講評。良い点にも必ず触れる" },
		next_recommendation: { type: "string", description: "次に取り組むべき内容の提案" },
	},
} as const;
