import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn } from "../auth-client";

export function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const result = await signIn.email({ email, password });
		setBusy(false);
		if (result.error) {
			setError("メールアドレスまたはパスワードが正しくありません");
			return;
		}
		navigate("/");
	}

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="mb-6 text-xl font-bold">ログイン</h1>
			<form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
				<label className="block text-sm">
					<span className="font-medium">メールアドレス</span>
					<input
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
					/>
				</label>
				<label className="block text-sm">
					<span className="font-medium">パスワード</span>
					<input
						type="password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
					/>
				</label>
				{error && <p className="text-sm text-rose-600">{error}</p>}
				<button
					type="submit"
					disabled={busy}
					className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:bg-stone-300"
				>
					{busy ? "ログイン中..." : "ログイン"}
				</button>
				<p className="text-center text-xs text-stone-500">
					アカウントをお持ちでない方は{" "}
					<Link to="/signup" className="text-brand-700 underline">
						新規登録
					</Link>
				</p>
			</form>
		</div>
	);
}
