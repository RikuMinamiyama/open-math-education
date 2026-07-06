import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiPost, useFetch, type AdminProblemDetail, type AdminTag } from "../../api";
import { MathText } from "../../components/Katex";

// 新規作成と編集を兼ねるフォーム
export function ProblemEditPage() {
	const { slug } = useParams();
	const isNew = !slug;
	const navigate = useNavigate();

	const { data: tagData } = useFetch<{ tags: AdminTag[] }>("/api/admin/tags");
	const { data: problemData, error: loadError } = useFetch<{ problem: AdminProblemDetail }>(
		isNew ? null : `/api/admin/problems/${slug}`,
	);

	const [form, setForm] = useState({
		slug: "",
		title: "",
		difficulty: 3,
		statementTex: "",
		answerTex: "",
		explanationTex: "",
		gradingNotes: "",
		status: "draft" as "draft" | "published",
		tagSlug: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (problemData?.problem) {
			const p = problemData.problem;
			setForm({
				slug: p.slug,
				title: p.title,
				difficulty: p.difficulty,
				statementTex: p.statementTex,
				answerTex: p.answerTex ?? "",
				explanationTex: p.explanationTex ?? "",
				gradingNotes: p.gradingNotes ?? "",
				status: p.status === "published" ? "published" : "draft",
				tagSlug: p.tagSlugs[0] ?? "",
			});
		}
	}, [problemData]);

	const allTags = tagData?.tags ?? [];
	const units = allTags.filter((t) => t.kind === "unit");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const body = {
			slug: form.slug,
			title: form.title,
			difficulty: form.difficulty,
			statementTex: form.statementTex,
			answerTex: form.answerTex || null,
			explanationTex: form.explanationTex || null,
			gradingNotes: form.gradingNotes || null,
			status: form.status,
			tagSlugs: form.tagSlug ? [form.tagSlug] : [],
		};
		try {
			if (isNew) {
				await apiPost("/api/admin/problems", body);
			} else {
				const res = await fetch(`/api/admin/problems/${slug}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});
				if (!res.ok) {
					const data = (await res.json()) as { error?: string };
					throw new Error(data.error ?? "保存に失敗しました");
				}
			}
			navigate("/admin");
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setBusy(false);
		}
	}

	if (loadError) return <p className="text-rose-600">{loadError}</p>;

	return (
		<div className="space-y-4">
			<nav className="text-sm text-stone-500">
				<Link to="/admin" className="hover:underline">
					問題管理
				</Link>
				<span className="mx-1">/</span>
				<span>{isNew ? "新規作成" : form.title}</span>
			</nav>
			<h1 className="text-xl font-bold">{isNew ? "新しい問題を作る" : "問題を編集する"}</h1>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<label className="block text-sm">
						<span className="font-medium">slug（URLに使う識別子）</span>
						<input
							type="text"
							required
							disabled={!isNew}
							value={form.slug}
							onChange={(e) => setForm({ ...form, slug: e.target.value })}
							placeholder="例: insu-bunkai-002"
							pattern="[a-z0-9][a-z0-9-]*"
							className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-teal-500 focus:outline-none disabled:bg-stone-100 disabled:text-stone-500"
						/>
					</label>
					<label className="block text-sm">
						<span className="font-medium">タイトル</span>
						<input
							type="text"
							required
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-teal-500 focus:outline-none"
						/>
					</label>
					<label className="block text-sm">
						<span className="font-medium">単元・項目</span>
						<select
							required
							value={form.tagSlug}
							onChange={(e) => setForm({ ...form, tagSlug: e.target.value })}
							className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-teal-500 focus:outline-none"
						>
							<option value="">選択してください</option>
							{units.map((unit) => (
								<optgroup key={unit.slug} label={`${unit.subject ?? ""} ${unit.name}`}>
									<option value={unit.slug}>{unit.name}（項目なし）</option>
									{allTags
										.filter((t) => t.parentSlug === unit.slug)
										.map((topic) => (
											<option key={topic.slug} value={topic.slug}>
												{topic.name}
											</option>
										))}
								</optgroup>
							))}
						</select>
					</label>
					<div className="grid grid-cols-2 gap-4">
						<label className="block text-sm">
							<span className="font-medium">難易度（1〜10）</span>
							<input
								type="number"
								required
								min={1}
								max={10}
								value={form.difficulty}
								onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
								className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-teal-500 focus:outline-none"
							/>
						</label>
						<label className="block text-sm">
							<span className="font-medium">状態</span>
							<select
								value={form.status}
								onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
								className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-teal-500 focus:outline-none"
							>
								<option value="draft">下書き</option>
								<option value="published">公開</option>
							</select>
						</label>
					</div>
				</div>

				<TexField
					label="問題文"
					required
					value={form.statementTex}
					onChange={(v) => setForm({ ...form, statementTex: v })}
					rows={5}
				/>
				<TexField label="模範解答" value={form.answerTex} onChange={(v) => setForm({ ...form, answerTex: v })} rows={3} />
				<TexField
					label="解説"
					value={form.explanationTex}
					onChange={(v) => setForm({ ...form, explanationTex: v })}
					rows={8}
				/>
				<label className="block text-sm">
					<span className="font-medium">採点基準（AI添削への指示。生徒には表示されません）</span>
					<textarea
						rows={4}
						value={form.gradingNotes}
						onChange={(e) => setForm({ ...form, gradingNotes: e.target.value })}
						placeholder="例: 平方完成の確認。軸が区間内にあることへの言及がない場合はlogicとして指摘。"
						className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm focus:border-teal-500 focus:outline-none"
					/>
				</label>

				{error && <p className="text-sm text-rose-600">{error}</p>}
				<div className="flex gap-3">
					<button
						type="submit"
						disabled={busy}
						className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-600 disabled:bg-stone-300"
					>
						{busy ? "保存中..." : "保存する"}
					</button>
					<Link to="/admin" className="rounded-lg border border-stone-300 px-5 py-2 text-sm text-stone-600 hover:bg-stone-100">
						キャンセル
					</Link>
				</div>
			</form>
		</div>
	);
}

// TeX入力とKaTeXプレビューのペア
function TexField({
	label,
	value,
	onChange,
	rows,
	required,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	rows: number;
	required?: boolean;
}) {
	return (
		<div className="text-sm">
			<span className="font-medium">
				{label}
				<span className="ml-2 font-normal text-stone-400">数式は $...$ または $$...$$ で囲む</span>
			</span>
			<div className="mt-1 grid grid-cols-1 gap-3 lg:grid-cols-2">
				<textarea
					rows={rows}
					required={required}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm focus:border-teal-500 focus:outline-none"
				/>
				<div className="rounded-lg border border-dashed border-stone-300 bg-white p-3">
					{value ? <MathText text={value} className="text-sm" /> : <span className="text-xs text-stone-400">プレビュー</span>}
				</div>
			</div>
		</div>
	);
}
