import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../api";
import { signUp } from "../auth-client";

export function SignupPage() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [agreed, setAgreed] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!agreed) return;
		setBusy(true);
		setError(null);
		const result = await signUp.email({ name, email, password });
		if (result.error) {
			setBusy(false);
			setError(result.error.message ?? "登録に失敗しました");
			return;
		}
		// 同意を記録する
		try {
			await apiPost("/api/consents", { kinds: ["tos", "privacy"] });
		} catch {
			// 同意記録の失敗で登録フローは止めない
		}
		setBusy(false);
		navigate("/");
	}

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="mb-6 text-xl font-bold">新規登録</h1>
			<form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
				<label className="block text-sm">
					<span className="font-medium">ニックネーム</span>
					<input
						type="text"
						required
						maxLength={30}
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="実名は使わないでください"
						className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-teal-500 focus:outline-none"
					/>
				</label>
				<label className="block text-sm">
					<span className="font-medium">メールアドレス</span>
					<input
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-teal-500 focus:outline-none"
					/>
				</label>
				<label className="block text-sm">
					<span className="font-medium">パスワード（8文字以上）</span>
					<input
						type="password"
						required
						minLength={8}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-teal-500 focus:outline-none"
					/>
				</label>
				<label className="flex items-start gap-2 text-xs text-stone-600">
					<input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
					<span>
						利用規約とプライバシーポリシーに同意します。未成年の方は保護者の同意を得た上で登録してください
					</span>
				</label>
				{error && <p className="text-sm text-rose-600">{error}</p>}
				<button
					type="submit"
					disabled={busy || !agreed}
					className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-medium text-white transition hover:bg-teal-600 disabled:bg-stone-300"
				>
					{busy ? "登録中..." : "登録する"}
				</button>
				<p className="text-center text-xs text-stone-500">
					すでにアカウントをお持ちの方は{" "}
					<Link to="/login" className="text-teal-700 underline">
						ログイン
					</Link>
				</p>
			</form>
		</div>
	);
}
