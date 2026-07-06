import { useEffect, useRef, useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { apiPostForm } from "../api";
import { changePassword, updateUser, useSession } from "../auth-client";
import { SectionHeading } from "../components/SectionHeading";

const inputClass =
	"mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none";

function Notice({ kind, text }: { kind: "success" | "error"; text: string }) {
	return <p className={`text-sm ${kind === "success" ? "text-emerald-600" : "text-rose-600"}`}>{text}</p>;
}

export function SettingsPage() {
	const { data: session, isPending } = useSession();

	const [name, setName] = useState("");
	const [profileBusy, setProfileBusy] = useState(false);
	const [profileNotice, setProfileNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

	const [avatarBusy, setAvatarBusy] = useState(false);
	const avatarInputRef = useRef<HTMLInputElement>(null);

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
	const [passwordBusy, setPasswordBusy] = useState(false);
	const [passwordNotice, setPasswordNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

	// セッション読み込み後に現在のニックネームを反映する
	useEffect(() => {
		if (session?.user) setName(session.user.name ?? "");
	}, [session?.user]);

	if (isPending) return <p className="text-stone-500">読み込み中...</p>;
	if (!session?.user) return <p className="text-sm text-stone-600">設定の変更にはログインしてください</p>;

	const user = session.user;

	async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setAvatarBusy(true);
		setProfileNotice(null);
		try {
			const { url } = await apiPostForm<{ url: string }>(
				"/api/me/avatar",
				(() => {
					const form = new FormData();
					form.append("image", file);
					return form;
				})(),
			);
			const result = await updateUser({ image: url });
			if (result.error) throw new Error("アイコンの更新に失敗しました");
			setProfileNotice({ kind: "success", text: "アイコンを更新しました" });
		} catch (err) {
			setProfileNotice({ kind: "error", text: (err as Error).message });
		} finally {
			setAvatarBusy(false);
			if (avatarInputRef.current) avatarInputRef.current.value = "";
		}
	}

	async function handleProfileSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			setProfileNotice({ kind: "error", text: "ニックネームを入力してください" });
			return;
		}
		if (trimmed.length > 30) {
			setProfileNotice({ kind: "error", text: "ニックネームは30文字までです" });
			return;
		}
		setProfileBusy(true);
		setProfileNotice(null);
		const result = await updateUser({ name: trimmed });
		setProfileBusy(false);
		if (result.error) {
			setProfileNotice({ kind: "error", text: "ニックネームの更新に失敗しました" });
			return;
		}
		setProfileNotice({ kind: "success", text: "プロフィールを保存しました" });
	}

	async function handlePasswordSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (newPassword.length < 8) {
			setPasswordNotice({ kind: "error", text: "新しいパスワードは8文字以上で入力してください" });
			return;
		}
		if (newPassword !== newPasswordConfirm) {
			setPasswordNotice({ kind: "error", text: "新しいパスワードが一致しません" });
			return;
		}
		setPasswordBusy(true);
		setPasswordNotice(null);
		const result = await changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
		setPasswordBusy(false);
		if (result.error) {
			setPasswordNotice({
				kind: "error",
				text:
					result.error.code === "INVALID_PASSWORD"
						? "現在のパスワードが正しくありません"
						: "パスワードの変更に失敗しました",
			});
			return;
		}
		setCurrentPassword("");
		setNewPassword("");
		setNewPasswordConfirm("");
		setPasswordNotice({ kind: "success", text: "パスワードを変更しました" });
	}

	return (
		<div className="mx-auto max-w-2xl space-y-10 pb-16">
			<h1 className="text-xl font-bold">設定</h1>

			<section>
				<SectionHeading title="プロフィール" />
				<form onSubmit={handleProfileSubmit} className="space-y-6 pt-5">
					<div>
						<span className="block text-sm font-medium text-stone-900">アイコン</span>
						<div className="mt-2 flex items-center gap-x-3">
							{user.image ? (
								<img src={user.image} alt="アイコン" className="size-12 rounded-full border border-stone-200 object-cover" />
							) : (
								<UserCircleIcon aria-hidden="true" className="size-12 text-stone-300" />
							)}
							<button
								type="button"
								onClick={() => avatarInputRef.current?.click()}
								disabled={avatarBusy}
								className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50 disabled:opacity-50"
							>
								{avatarBusy ? "アップロード中..." : "変更"}
							</button>
							<input
								ref={avatarInputRef}
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onChange={handleAvatarChange}
								className="hidden"
							/>
						</div>
						<p className="mt-2 text-xs text-stone-500">JPEG・PNG・WebP形式 2MBまで</p>
					</div>

					<label className="block text-sm sm:max-w-sm">
						<span className="font-medium text-stone-900">ニックネーム</span>
						<input type="text" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
						<p className="mt-2 text-xs text-stone-500">実名は使わないでください</p>
					</label>

					{profileNotice && <Notice {...profileNotice} />}
					<button
						type="submit"
						disabled={profileBusy}
						className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:bg-stone-300"
					>
						{profileBusy ? "保存中..." : "保存"}
					</button>
				</form>
			</section>

			<section>
				<SectionHeading title="パスワード変更" />
				<form onSubmit={handlePasswordSubmit} className="space-y-4 pt-5 sm:max-w-sm">
					<label className="block text-sm">
						<span className="font-medium text-stone-900">現在のパスワード</span>
						<input
							type="password"
							required
							autoComplete="current-password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							className={inputClass}
						/>
					</label>
					<label className="block text-sm">
						<span className="font-medium text-stone-900">新しいパスワード</span>
						<input
							type="password"
							required
							autoComplete="new-password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className={inputClass}
						/>
						<p className="mt-2 text-xs text-stone-500">8文字以上</p>
					</label>
					<label className="block text-sm">
						<span className="font-medium text-stone-900">新しいパスワード（確認）</span>
						<input
							type="password"
							required
							autoComplete="new-password"
							value={newPasswordConfirm}
							onChange={(e) => setNewPasswordConfirm(e.target.value)}
							className={inputClass}
						/>
					</label>
					{passwordNotice && <Notice {...passwordNotice} />}
					<button
						type="submit"
						disabled={passwordBusy}
						className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:bg-stone-300"
					>
						{passwordBusy ? "変更中..." : "パスワードを変更"}
					</button>
				</form>
			</section>

			<section>
				<SectionHeading title="アカウント情報" />
				<dl className="space-y-1 pt-5 text-sm">
					<div className="flex gap-3">
						<dt className="w-32 shrink-0 text-stone-500">メールアドレス</dt>
						<dd className="text-stone-900">{user.email}</dd>
					</div>
				</dl>
			</section>
		</div>
	);
}
