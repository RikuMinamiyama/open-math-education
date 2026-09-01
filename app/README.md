# やさしいみんなの数学 — アプリ

AI添削を核にした数学IAの演習アプリ。設計は [docs/db_schema.md](../docs/db_schema.md) を参照。

## 技術スタック

- フロント: React + Vite + TailwindCSS + KaTeX
- API: Hono on Cloudflare Workers
- DB: D1 + Drizzle ORM / 画像: R2 / 非同期添削: Queues
- AI添削: Claude API（`ANTHROPIC_API_KEY` 未設定時はモック添削で動作）
- 既定モデルは `claude-sonnet-5`（新規キーで Opus が 403 になることがあるため。権限があれば `GRADING_MODEL` を `claude-opus-4-8` に変更できる）
- 認証: better-auth

## ローカル開発

```bash
pnpm install
cp .dev.vars.example .dev.vars   # AUTH_SECRETを設定

pnpm db:migrate   # ローカルD1にマイグレーション適用
pnpm db:seed      # 単元タグとサンプル問題を投入

pnpm dev          # http://localhost:5173
```

実際のAI添削を試す場合は `.dev.vars` に `ANTHROPIC_API_KEY` を設定する。

## 問題・解説の追加

問題の作成・編集は管理画面（`/admin`）から行う。承認済みユーザー（`teacher` / `admin` ロール）だけが利用できる。

1. 対象ユーザーにロールを付与する（承認）

```bash
# ローカル
pnpm wrangler d1 execute DB --local --command "UPDATE users SET role = 'admin' WHERE email = 'you@example.com'"
# 本番は --local を --remote に変える
# 投稿を許可する一般ユーザーには 'teacher' を付与する
```

2. ログイン後、ヘッダーの「管理」から問題の作成・編集画面へ
3. 問題文・模範解答・解説はKaTeX互換TeX（`$...$` / `$$...$$`）で入力でき、プレビューを見ながら編集できる
4. 採点基準はAI添削のプロンプトに注入される（生徒には表示されない）
5. 状態を「公開」にすると単元ページに表示される

単元・項目タグの追加は現状 `seed/seed.sql` かSQL直接実行で行う（管理画面での編集はフェーズ2）。

## スキーマ変更の手順

1. `src/worker/db/schema.ts` を編集（設計意図は `docs/db_schema.md` にも反映する）
2. `pnpm db:generate` でマイグレーションSQLを生成
3. `pnpm db:migrate` でローカルに適用

## デプロイ

```bash
wrangler d1 create ome-db        # 発行されたIDを wrangler.jsonc に設定
wrangler r2 bucket create ome-answers
wrangler queues create ome-grading
wrangler secret put AUTH_SECRET
wrangler secret put ANTHROPIC_API_KEY

pnpm db:migrate:remote
pnpm db:seed:remote
pnpm run deploy
```

R2バケットには答案画像の保持期間ポリシー（90日で自動削除）をダッシュボードまたはAPIで設定すること。
