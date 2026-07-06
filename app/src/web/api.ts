import { useCallback, useEffect, useState } from "react";

export class ApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

async function parseError(res: Response): Promise<ApiError> {
	let message = `エラーが発生しました (${res.status})`;
	try {
		const body = (await res.json()) as { error?: string };
		if (body.error) message = body.error;
	} catch {
		// JSONでないレスポンスはそのまま
	}
	return new ApiError(res.status, message);
}

export async function apiGet<T>(path: string): Promise<T> {
	const res = await fetch(path);
	if (!res.ok) throw await parseError(res);
	return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw await parseError(res);
	return res.json() as Promise<T>;
}

export async function apiPostForm<T>(path: string, form: FormData): Promise<T> {
	const res = await fetch(path, { method: "POST", body: form });
	if (!res.ok) throw await parseError(res);
	return res.json() as Promise<T>;
}

export function useFetch<T>(path: string | null) {
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(path !== null);
	const [version, setVersion] = useState(0);

	useEffect(() => {
		if (path === null) return;
		let cancelled = false;
		setLoading(true);
		apiGet<T>(path)
			.then((d) => {
				if (!cancelled) {
					setData(d);
					setError(null);
				}
			})
			.catch((e: Error) => {
				if (!cancelled) setError(e.message);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [path, version]);

	const reload = useCallback(() => setVersion((v) => v + 1), []);
	return { data, error, loading, reload };
}

//--------------------------------------------------
// APIレスポンスの型
//--------------------------------------------------

export interface Me {
	user: { id: string; name: string; email: string; role: string } | null;
	usage?: { used: number; limit: number };
}

export function isEditor(me: Me | null): boolean {
	return me?.user != null && (me.user.role === "teacher" || me.user.role === "admin");
}

export interface Unit {
	slug: string;
	name: string;
	subject: string | null;
	problemCount: number;
}

export interface ProblemSummary {
	slug: string;
	title: string;
	difficulty: number;
}

export interface ProblemDetail {
	slug: string;
	title: string;
	difficulty: number;
	statementTex: string;
	answerTex: string | null;
	explanationTex: string | null;
	license: string;
	attribution: string | null;
	tags: ProblemTag[];
}

export interface ProblemTag {
	slug: string;
	name: string;
	kind: "unit" | "topic";
	parent: { slug: string; name: string } | null;
}

export interface UnitGroup {
	topic: { slug: string; name: string } | null;
	problems: ProblemSummary[];
}

//--------------------------------------------------
// 問題管理（承認済みユーザー向け）
//--------------------------------------------------

export interface AdminTag {
	slug: string;
	name: string;
	kind: "unit" | "topic";
	subject: string | null;
	parentSlug: string | null;
	parentName: string | null;
}

export interface AdminProblemSummary {
	slug: string;
	title: string;
	difficulty: number;
	status: "draft" | "published" | "archived";
	updatedAt: string;
}

export interface AdminProblemDetail {
	slug: string;
	title: string;
	difficulty: number;
	statementTex: string;
	answerTex: string | null;
	explanationTex: string | null;
	gradingNotes: string | null;
	status: "draft" | "published" | "archived";
	tagSlugs: string[];
}

export type SubmissionStatus = "uploaded" | "queued" | "grading" | "graded" | "failed";

export type Verdict = "correct" | "partially_correct" | "incorrect" | "cannot_judge" | "unreadable";

export interface Feedback {
	transcription: string;
	steps: { page: number; summary: string; ok: boolean; comment: string }[];
	errors: { location: string; type: string; explanation: string; hint: string }[];
	overall_comment: string;
	next_recommendation: string;
}

export interface SubmissionSummary {
	id: string;
	status: SubmissionStatus;
	createdAt: string;
	problemSlug: string;
	problemTitle: string;
	verdict: Verdict | null;
}

export interface SubmissionDetail {
	id: string;
	status: SubmissionStatus;
	createdAt: string;
	problem: { slug: string; title: string; statementTex: string } | null;
	images: { id: string; pageNo: number }[];
	grading: {
		graderType: "ai" | "human";
		model: string | null;
		verdict: Verdict;
		confidence: number | null;
		feedback: Feedback;
		createdAt: string;
	} | null;
}
