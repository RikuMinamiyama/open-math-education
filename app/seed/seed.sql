-- シードデータ（本番へは pnpm db:seed:remote で投入する）
-- 本来はコンテンツリポジトリからの同期スクリプトが生成する（docs/db_schema.md 設計原則1）
-- 提出データが紐付いた問題を REPLACE すると削除扱いになりFK制約で失敗するため upsert で書く

--------------------------------------------------
-- 数IAの単元タグ
--------------------------------------------------

INSERT INTO tags (id, slug, name, kind, parent_id, subject, sort_order) VALUES
  ('01980000-0000-7000-8000-000000000101', 'shiki',                 '数と式',                 'unit', NULL, '数I', 1),
  ('01980000-0000-7000-8000-000000000102', 'nijikansu',             '二次関数',               'unit', NULL, '数I', 2),
  ('01980000-0000-7000-8000-000000000103', 'zukei-keiryo',          '図形と計量',             'unit', NULL, '数I', 3),
  ('01980000-0000-7000-8000-000000000104', 'data-bunseki',          'データの分析',           'unit', NULL, '数I', 4),
  ('01980000-0000-7000-8000-000000000105', 'baainokazu-kakuritsu',  '場合の数と確率',         'unit', NULL, '数A', 5),
  ('01980000-0000-7000-8000-000000000106', 'zukei-seishitsu',       '図形の性質',             'unit', NULL, '数A', 6),
  ('01980000-0000-7000-8000-000000000107', 'seisu',                 '整数の性質',             'unit', NULL, '数A', 7)
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  name = excluded.name,
  kind = excluded.kind,
  parent_id = excluded.parent_id,
  subject = excluded.subject,
  sort_order = excluded.sort_order;

--------------------------------------------------
-- 項目タグ
-- 数と式は現行課程（平成30年告示）の内容構成に合わせた7項目
-- 式の展開と因数分解 / 実数 / 一次不等式（絶対値含む） / 集合と命題
--------------------------------------------------

INSERT INTO tags (id, slug, name, kind, parent_id, subject, sort_order) VALUES
  ('01980000-0000-7000-8000-000000000121', 'shiki-tenkai',          '式の展開',                     'topic', '01980000-0000-7000-8000-000000000101', NULL, 11),
  ('01980000-0000-7000-8000-000000000111', 'insu-bunkai',           '因数分解',                     'topic', '01980000-0000-7000-8000-000000000101', NULL, 12),
  ('01980000-0000-7000-8000-000000000122', 'jissu-heihokon',        '実数と平方根',                 'topic', '01980000-0000-7000-8000-000000000101', NULL, 13),
  ('01980000-0000-7000-8000-000000000123', 'ichiji-futoshiki',      '一次不等式',                   'topic', '01980000-0000-7000-8000-000000000101', NULL, 14),
  ('01980000-0000-7000-8000-000000000124', 'zettaichi-hoteishiki',  '絶対値を含む方程式・不等式',   'topic', '01980000-0000-7000-8000-000000000101', NULL, 15),
  ('01980000-0000-7000-8000-000000000125', 'shugo',                 '集合',                         'topic', '01980000-0000-7000-8000-000000000101', NULL, 16),
  ('01980000-0000-7000-8000-000000000126', 'meidai-shomei',         '命題と証明',                   'topic', '01980000-0000-7000-8000-000000000101', NULL, 17),
  ('01980000-0000-7000-8000-000000000112', 'nijikansu-max-min',     '最大値・最小値',               'topic', '01980000-0000-7000-8000-000000000102', NULL, 21),
  ('01980000-0000-7000-8000-000000000113', 'kakuritsu-kihon',       '確率の基本',                   'topic', '01980000-0000-7000-8000-000000000105', NULL, 51),
  ('01980000-0000-7000-8000-000000000114', 'yakusu-baisu',          '約数と倍数',                   'topic', '01980000-0000-7000-8000-000000000107', NULL, 71)
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  name = excluded.name,
  kind = excluded.kind,
  parent_id = excluded.parent_id,
  subject = excluded.subject,
  sort_order = excluded.sort_order;

--------------------------------------------------
-- 数と式の問題（自作 CC BY-SA 4.0）
-- 式の展開
--------------------------------------------------

INSERT INTO problems
  (id, slug, title, difficulty, statement_tex, answer_tex, explanation_tex, grading_notes, license, source, attribution, status, content_hash, created_at, updated_at)
VALUES
  (
    '01980000-0000-7000-8000-000000000302',
    'shiki-002',
    '整式の次数と定数項',
    1,
    '整式 $A = 3x^2 - 2xy + y^2 - 4x + 1$ について、次の問いに答えよ。

(1) $x$ に着目したとき、$A$ の次数と定数項を答えよ。
(2) $y$ に着目したとき、$A$ の次数と定数項を答えよ。',
    '(1) 次数 $2$、定数項 $y^2 + 1$
(2) 次数 $2$、定数項 $3x^2 - 4x + 1$',
    '着目する文字以外の文字は数と同じように定数として扱う。

(1) $x$ に着目して降べきの順に整理すると
$$A = 3x^2 + (-2y - 4)x + (y^2 + 1)$$
よって次数は $2$、$x$ を含まない項をまとめた $y^2 + 1$ が定数項である。

(2) $y$ に着目して整理すると
$$A = y^2 + (-2x)y + (3x^2 - 4x + 1)$$
よって次数は $2$、定数項は $3x^2 - 4x + 1$ である。',
    '着目する文字以外を定数として扱えているかを確認してください。定数項を 1 とだけ答えている場合は着目する文字の考え方の誤解なので misconception として指摘してください。降べきの順への整理が書かれていなくても、次数と定数項が正しければ正解です。片方の小問だけ正しい場合は正しい方を認めた上で誤りを指摘してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000303',
    'shiki-003',
    '乗法公式による展開',
    2,
    '次の式を展開せよ。

(1) $(2x + 3y)^2$
(2) $(3a - 4b)(3a + 4b)$
(3) $(2x + 1)(3x - 4)$',
    '(1) $4x^2 + 12xy + 9y^2$
(2) $9a^2 - 16b^2$
(3) $6x^2 - 5x - 4$',
    '(1) $(a + b)^2 = a^2 + 2ab + b^2$ より
$$(2x + 3y)^2 = 4x^2 + 12xy + 9y^2$$

(2) 和と差の積 $(a - b)(a + b) = a^2 - b^2$ より
$$(3a - 4b)(3a + 4b) = 9a^2 - 16b^2$$

(3) $(ax + b)(cx + d) = acx^2 + (ad + bc)x + bd$ より
$$(2x + 1)(3x - 4) = 6x^2 + (-8 + 3)x - 4 = 6x^2 - 5x - 4$$',
    '途中式がなくても展開結果が正しければ正解です。(1) で中央の項 12xy が抜けている場合は (a+b)^2 = a^2 + b^2 という誤解の可能性が高いので misconception として指摘してください。符号や係数の誤りは calculation として指摘してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000304',
    'shiki-004',
    '掛ける順序を工夫する展開',
    3,
    '次の式を展開せよ。

$$(x + 1)(x - 2)(x + 3)(x - 4)$$',
    '$x^4 - 2x^3 - 13x^2 + 14x + 24$',
    '前から順に掛けると計算が煩雑になる。$x$ の係数の和が等しくなる組を作って掛ける。
$$(x + 1)(x - 2) = x^2 - x - 2$$
$$(x + 3)(x - 4) = x^2 - x - 12$$
どちらにも $x^2 - x$ が現れるので $t = x^2 - x$ とおくと
$$(t - 2)(t - 12) = t^2 - 14t + 24$$
$t$ を戻して
$$(x^2 - x)^2 - 14(x^2 - x) + 24 = x^4 - 2x^3 + x^2 - 14x^2 + 14x + 24$$
よって
$$x^4 - 2x^3 - 13x^2 + 14x + 24$$',
    '組み合わせの工夫をせず前から順に展開していても、結果が正しければ正解です。その場合は (x+1)(x-2) と (x+3)(x-4) を組み合わせて x^2 - x を置き換える方法を、計算が楽になる別解として紹介してください。展開途中の符号や係数の誤りは calculation として指摘してください。置き換えた文字を戻し忘れている場合は incomplete として指摘してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  difficulty = excluded.difficulty,
  statement_tex = excluded.statement_tex,
  answer_tex = excluded.answer_tex,
  explanation_tex = excluded.explanation_tex,
  grading_notes = excluded.grading_notes,
  license = excluded.license,
  source = excluded.source,
  attribution = excluded.attribution,
  status = excluded.status,
  updated_at = excluded.updated_at;

--------------------------------------------------
-- 因数分解
--------------------------------------------------

INSERT INTO problems
  (id, slug, title, difficulty, statement_tex, answer_tex, explanation_tex, grading_notes, license, source, attribution, status, content_hash, created_at, updated_at)
VALUES
  (
    '01980000-0000-7000-8000-000000000305',
    'shiki-005',
    '共通因数と公式による因数分解',
    1,
    '次の式を因数分解せよ。

(1) $6a^2 b - 4ab^2$
(2) $x^2 + 8x + 16$
(3) $x^2 - x - 12$',
    '(1) $2ab(3a - 2b)$
(2) $(x + 4)^2$
(3) $(x - 4)(x + 3)$',
    '(1) 各項に共通な因数 $2ab$ をくくり出して
$$6a^2 b - 4ab^2 = 2ab(3a - 2b)$$

(2) $x^2 + 2 \cdot 4 \cdot x + 4^2$ の形なので
$$x^2 + 8x + 16 = (x + 4)^2$$

(3) 掛けて $-12$、足して $-1$ になる2数は $-4$ と $3$ なので
$$x^2 - x - 12 = (x - 4)(x + 3)$$',
    '(1) で共通因数をすべてくくり出せているかを確認してください。2(3a^2 b - 2ab^2) のように不完全な場合は incomplete として指摘してください。(3) の符号の誤りは calculation として指摘してください。展開して元の式に戻る検算があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000306',
    'shiki-006',
    'たすき掛けによる因数分解',
    2,
    '次の式を因数分解せよ。

(1) $3x^2 + 10x + 8$
(2) $6x^2 - 7x - 3$',
    '(1) $(x + 2)(3x + 4)$
(2) $(2x - 3)(3x + 1)$',
    '(1) $x^2$ の係数 $3 = 1 \times 3$、定数項 $8 = 2 \times 4$ の組から、たすき掛けで $x$ の係数が $1 \cdot 4 + 3 \cdot 2 = 10$ になる組み合わせを探すと
$$3x^2 + 10x + 8 = (x + 2)(3x + 4)$$

(2) $6 = 2 \times 3$、$-3 = (-3) \times 1$ の組で $2 \cdot 1 + 3 \cdot (-3) = -7$ となるので
$$6x^2 - 7x - 3 = (2x - 3)(3x + 1)$$',
    'たすき掛けの過程が書かれていなくても、結果を展開して元の式に戻れば正解です。係数の組み合わせの誤りは calculation として指摘してください。因数分解の答えは因数の順序が違っても正解です。答えのみで途中の試行が全くない場合でも正解としますが、検算の習慣を勧めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000201',
    'shiki-001',
    '置き換えを使う因数分解',
    2,
    '次の式を因数分解せよ。

$$x^2 - 2xy + y^2 - 9$$',
    '$$(x - y + 3)(x - y - 3)$$',
    '前半の3項に注目すると $x^2 - 2xy + y^2 = (x - y)^2$ である。

$A = x - y$ とおくと、与式は
$$A^2 - 9 = (A + 3)(A - 3)$$
と因数分解できる。$A$ を戻して
$$x^2 - 2xy + y^2 - 9 = (x - y + 3)(x - y - 3)$$',
    '置き換えを明示していなくても構いません。最終的な答えを展開して元の式と一致すれば正解とします。(x-y)^2 - 9 の形まで変形して止まっている場合は incomplete として指摘してください。符号の誤りは calculation として指摘してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000307',
    'shiki-007',
    '2種類の文字を含む式の因数分解',
    4,
    '次の式を因数分解せよ。

$$x^2 + 3xy + 2y^2 + 2x + 3y + 1$$',
    '$$(x + y + 1)(x + 2y + 1)$$',
    '$x$ について降べきの順に整理する。
$$x^2 + (3y + 2)x + (2y^2 + 3y + 1)$$
定数とみなした部分を因数分解すると
$$2y^2 + 3y + 1 = (y + 1)(2y + 1)$$
この2つの因数の和は $(y + 1) + (2y + 1) = 3y + 2$ で $x$ の係数と一致するから
$$x^2 + (3y + 2)x + (y + 1)(2y + 1) = (x + y + 1)(x + 2y + 1)$$',
    '1つの文字について整理する方針が取れているかを確認してください。y について整理した解答も正しければ正解です。定数とみなした部分 2y^2 + 3y + 1 の因数分解の誤りは calculation として指摘してください。整理の方針が立たず行き詰まっている場合は、次数の低い文字（この問題ではどちらでもよい）について整理する指針を助言してください。展開による検算があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  difficulty = excluded.difficulty,
  statement_tex = excluded.statement_tex,
  answer_tex = excluded.answer_tex,
  explanation_tex = excluded.explanation_tex,
  grading_notes = excluded.grading_notes,
  license = excluded.license,
  source = excluded.source,
  attribution = excluded.attribution,
  status = excluded.status,
  updated_at = excluded.updated_at;

--------------------------------------------------
-- 実数と平方根
--------------------------------------------------

INSERT INTO problems
  (id, slug, title, difficulty, statement_tex, answer_tex, explanation_tex, grading_notes, license, source, attribution, status, content_hash, created_at, updated_at)
VALUES
  (
    '01980000-0000-7000-8000-000000000308',
    'shiki-008',
    '循環小数を分数で表す',
    1,
    '循環小数 $0.\dot{4}\dot{5}$ を分数で表せ。',
    '$\dfrac{5}{11}$',
    '$x = 0.\dot{4}\dot{5} = 0.454545\dots$ とおく。循環節の長さが $2$ なので $100$ 倍すると
$$100x = 45.4545\dots$$
辺々引くと
$$100x - x = 45$$
$$99x = 45$$
よって
$$x = \frac{45}{99} = \frac{5}{11}$$',
    '循環節の長さに合わせて 100 倍し差を取る方針を確認してください。45/99 のまま約分していない場合は incomplete として指摘してください。10 倍との差で処理するなど循環節の長さを誤っている場合は misconception として指摘してください。5/11 を割り算して 0.4545… に戻る検算があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000309',
    'shiki-009',
    '分母の有理化と式の値',
    2,
    '$x = \dfrac{1}{\sqrt{5} - 2}$ のとき、次の問いに答えよ。

(1) $x$ の分母を有理化して簡単にせよ。
(2) $x + \dfrac{1}{x}$ の値を求めよ。',
    '(1) $\sqrt{5} + 2$
(2) $2\sqrt{5}$',
    '(1) 分母と分子に $\sqrt{5} + 2$ を掛けて
$$x = \frac{\sqrt{5} + 2}{(\sqrt{5} - 2)(\sqrt{5} + 2)} = \frac{\sqrt{5} + 2}{5 - 4} = \sqrt{5} + 2$$

(2) もとの定義から $\dfrac{1}{x} = \sqrt{5} - 2$ なので
$$x + \frac{1}{x} = (\sqrt{5} + 2) + (\sqrt{5} - 2) = 2\sqrt{5}$$',
    '(1) 分母分子に √5 + 2 を掛ける操作を確認してください。分母を 5 - 2 = 3 としている場合は calculation として指摘してください。(2) で 1/(√5+2) を改めて有理化して計算していても正しければ正解ですが、1/x がもとの式の逆数 √5 - 2 であることに気づくと速いことを別解として紹介してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000310',
    'shiki-010',
    '平方根の整数部分・小数部分',
    3,
    '$\sqrt{7}$ の整数部分を $a$、小数部分を $b$ とする。

(1) $a$ と $b$ の値を求めよ。
(2) $b^2 + 4b$ の値を求めよ。',
    '(1) $a = 2$、$b = \sqrt{7} - 2$
(2) $3$',
    '(1) $4 < 7 < 9$ より
$$2 < \sqrt{7} < 3$$
よって整数部分は $a = 2$、小数部分は
$$b = \sqrt{7} - a = \sqrt{7} - 2$$

(2) 因数分解を利用すると
$$b^2 + 4b = b(b + 4) = (\sqrt{7} - 2)(\sqrt{7} + 2) = 7 - 4 = 3$$

（$b^2 = 11 - 4\sqrt{7}$ と $4b = 4\sqrt{7} - 8$ を直接足しても同じ結果になる）',
    '2 < √7 < 3 の根拠（4 < 7 < 9 など）が書かれているかを確認してください。根拠なく a = 2 としている場合は logic として指摘してください。√7 ≒ 2.645 のような近似値で b を小数として扱っている場合は、小数部分は √7 - 2 と表すことを misconception として指摘してください。(2) は展開して直接計算しても正解です。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000311',
    'shiki-011',
    '対称式の値',
    4,
    '$x + y = 4$、$xy = 2$ のとき、次の式の値を求めよ。

(1) $x^2 + y^2$
(2) $\dfrac{y}{x} + \dfrac{x}{y}$
(3) $x > y$ のとき $x - y$',
    '(1) $12$
(2) $6$
(3) $2\sqrt{2}$',
    '(1) $x^2 + y^2 = (x + y)^2 - 2xy = 16 - 4 = 12$

(2) 通分すると
$$\frac{y}{x} + \frac{x}{y} = \frac{x^2 + y^2}{xy} = \frac{12}{2} = 6$$

(3) $(x - y)^2 = (x + y)^2 - 4xy = 16 - 8 = 8$
$x > y$ より $x - y > 0$ なので
$$x - y = \sqrt{8} = 2\sqrt{2}$$',
    '(1)(2) は対称式を基本対称式 x + y と xy で表す変形を確認してください。(3) で x - y = ±2√2 のまま、または符号の選択理由（x > y より正）が書かれていない場合は logic として指摘してください。x と y を具体的に求めて（x = 2 + √2 など）代入する解法も正しければ正解です。√8 のまま整理していない場合は notation として指摘してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  difficulty = excluded.difficulty,
  statement_tex = excluded.statement_tex,
  answer_tex = excluded.answer_tex,
  explanation_tex = excluded.explanation_tex,
  grading_notes = excluded.grading_notes,
  license = excluded.license,
  source = excluded.source,
  attribution = excluded.attribution,
  status = excluded.status,
  updated_at = excluded.updated_at;

--------------------------------------------------
-- 一次不等式
--------------------------------------------------

INSERT INTO problems
  (id, slug, title, difficulty, statement_tex, answer_tex, explanation_tex, grading_notes, license, source, attribution, status, content_hash, created_at, updated_at)
VALUES
  (
    '01980000-0000-7000-8000-000000000312',
    'shiki-012',
    '一次不等式の解法',
    1,
    '次の不等式を解け。

(1) $4x - 7 < 2x + 5$
(2) $\dfrac{x - 1}{2} \ge \dfrac{2x + 1}{3} - 1$',
    '(1) $x < 6$
(2) $x \le 1$',
    '(1) 移項して整理する。
$$4x - 2x < 5 + 7$$
$$2x < 12$$
$$x < 6$$

(2) 両辺に $6$ を掛けて分母を払う。
$$3(x - 1) \ge 2(2x + 1) - 6$$
$$3x - 3 \ge 4x - 4$$
$$-x \ge -1$$
両辺を $-1$ で割ると不等号の向きが変わるので
$$x \le 1$$',
    '(2) で分母を払うときに右辺の -1 にも 6 を掛けているかを確認してください。掛け忘れは calculation として指摘してください。負の数で割るときに不等号の向きを変えていない場合は misconception として指摘してください。(1)(2) とも等号の有無（< と ≦）が問題と対応しているかも確認してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000313',
    'shiki-013',
    '連立不等式',
    2,
    '次の連立不等式を解け。

$$\begin{cases} 3x + 2 > x - 4 \\ 5x - 3 \le 2x + 6 \end{cases}$$',
    '$-3 < x \le 3$',
    '1つ目の不等式から
$$2x > -6$$
$$x > -3$$
2つ目の不等式から
$$3x \le 9$$
$$x \le 3$$
2つの解の共通範囲を数直線で確認して
$$-3 < x \le 3$$',
    'それぞれの不等式の解と、共通範囲を取る操作を確認してください。共通範囲ではなく2つの解を並べただけの場合は incomplete として指摘してください。和集合（x > -3 または x ≦ 3 で全実数など）にしている場合は misconception として指摘してください。端点の等号の扱い（-3 を含まず 3 を含む）の誤りは calculation として指摘してください。数直線の図があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000314',
    'shiki-014',
    '一次不等式の文章題',
    3,
    '1個 $120$ 円のりんごと1個 $80$ 円のみかんを合わせて $15$ 個買い、代金を $1500$ 円以下にしたい。りんごは最大で何個買えるか。',
    '$7$ 個',
    'りんごを $x$ 個買うとすると、みかんは $(15 - x)$ 個で、$0 \le x \le 15$ である。代金の条件から
$$120x + 80(15 - x) \le 1500$$
$$120x + 1200 - 80x \le 1500$$
$$40x \le 300$$
$$x \le 7.5$$
$x$ は $0$ 以上 $15$ 以下の整数なので、最大は $x = 7$。

よってりんごは最大 $7$ 個買える。

（検算 $120 \times 7 + 80 \times 8 = 840 + 640 = 1480 \le 1500$）',
    'りんごの個数を文字でおいて不等式を立てられているかを確認してください。x ≦ 7.5 から答えを 7.5 個や 8 個としている場合は、個数が整数であることの吟味漏れを logic として指摘してください。みかんの個数を文字でおいた解答も正しければ正解です。答えの検算があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000315',
    'shiki-015',
    '解の個数から定数を定める',
    4,
    '$x$ についての不等式 $x + a \ge 4x - 6$ を満たす自然数 $x$ がちょうど $3$ 個であるとき、定数 $a$ の値の範囲を求めよ。',
    '$3 \le a < 6$',
    '不等式を解くと
$$a + 6 \ge 3x$$
$$x \le \frac{a + 6}{3}$$
これを満たす自然数がちょうど $3$ 個であるのは、$x = 1, 2, 3$ が解で $x = 4$ が解でないときである。よって
$$3 \le \frac{a + 6}{3} < 4$$
各辺に $3$ を掛けて
$$9 \le a + 6 < 12$$
$$3 \le a < 6$$

（確認 $a = 3$ のとき $x \le 3$ で解は $1, 2, 3$ の3個。$a = 6$ のとき $x \le 4$ で4個になり不適）',
    '不等式の解 x ≦ (a+6)/3 を正しく導けているかを確認してください。「x = 3 が解で x = 4 が解でない」という条件の立式、特に両端の等号の扱い（3 ≦ (a+6)/3 には等号が入り (a+6)/3 < 4 には入らない）を重点的に確認してください。等号の誤りは logic として指摘してください。a = 3 や a = 6 など端の値を代入して確かめる検算があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  difficulty = excluded.difficulty,
  statement_tex = excluded.statement_tex,
  answer_tex = excluded.answer_tex,
  explanation_tex = excluded.explanation_tex,
  grading_notes = excluded.grading_notes,
  license = excluded.license,
  source = excluded.source,
  attribution = excluded.attribution,
  status = excluded.status,
  updated_at = excluded.updated_at;

--------------------------------------------------
-- 絶対値を含む方程式・不等式
--------------------------------------------------

INSERT INTO problems
  (id, slug, title, difficulty, statement_tex, answer_tex, explanation_tex, grading_notes, license, source, attribution, status, content_hash, created_at, updated_at)
VALUES
  (
    '01980000-0000-7000-8000-000000000316',
    'shiki-016',
    '絶対値を含む方程式・不等式の基本',
    2,
    '次の方程式・不等式を解け。

(1) $|x - 3| = 5$
(2) $|x + 2| < 4$',
    '(1) $x = 8, -2$
(2) $-6 < x < 2$',
    '$c > 0$ のとき $|X| = c \iff X = \pm c$、$|X| < c \iff -c < X < c$ を使う。

(1) $x - 3 = 5$ または $x - 3 = -5$ より
$$x = 8, \ -2$$

(2) $-4 < x + 2 < 4$ の各辺から $2$ を引いて
$$-6 < x < 2$$',
    '(1) で x = 8 のみの場合は負の側の見落としなので incomplete として指摘してください。(2) を x < 2 のみとしている場合は絶対値不等式の理解不足なので misconception として指摘してください。x + 2 の符号での場合分けで解いていても正しければ正解です。絶対値は原点（または基準の点）からの距離であるという解釈に触れた説明があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000317',
    'shiki-017',
    '絶対値を含む不等式',
    3,
    '次の不等式を解け。

$$|2x - 1| \ge 3$$',
    '$x \le -1$ または $x \ge 2$',
    '$c > 0$ のとき $|X| \ge c \iff X \le -c$ または $X \ge c$ を使う。

$2x - 1 \le -3$ または $2x - 1 \ge 3$ より

$2x \le -2$ すなわち $x \le -1$、または $2x \ge 4$ すなわち $x \ge 2$

よって
$$x \le -1 \ または \ x \ge 2$$',
    '「2x - 1 ≦ -3 または 2x - 1 ≧ 3」の形に正しく分解できているかを確認してください。「または」を「かつ」として共通範囲を取り解なしなどとしている場合は misconception として指摘してください。-3 ≦ 2x - 1 ≦ 3 の形にしている場合は不等号の向きの誤解なので misconception として指摘してください。数直線による確認があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000318',
    'shiki-018',
    '場合分けによる絶対値方程式',
    5,
    '次の方程式を解け。

$$|x - 1| + |x - 3| = 6$$',
    '$x = -1, 5$',
    '絶対値の中身の符号が変わる $x = 1, 3$ を境に場合分けする。

[1] $x < 1$ のとき
$$-(x - 1) - (x - 3) = 6$$
$$-2x + 4 = 6$$
$$x = -1$$
これは $x < 1$ を満たすので解である。

[2] $1 \le x < 3$ のとき
$$(x - 1) - (x - 3) = 2$$
左辺は常に $2$ で $6$ にならないから、この範囲に解はない。

[3] $x \ge 3$ のとき
$$(x - 1) + (x - 3) = 6$$
$$2x - 4 = 6$$
$$x = 5$$
これは $x \ge 3$ を満たすので解である。

よって
$$x = -1, \ 5$$',
    '場合分けの区間が実数全体を漏れなく覆っているかを確認してください。各場合で得た解がその場合の範囲を満たすかの吟味がない場合は logic として指摘してください。[2] の範囲で解なしとなることの記述も確認してください。境界の等号の入れ方（x ≦ 1 と x < 1 など）は解答と異なっていても、全体を漏れなく覆っていれば正解です。数直線上の距離の和と解釈する別解（1 と 3 から距離の和が 6 になる点）も正しければ正解とし、その解釈を褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  difficulty = excluded.difficulty,
  statement_tex = excluded.statement_tex,
  answer_tex = excluded.answer_tex,
  explanation_tex = excluded.explanation_tex,
  grading_notes = excluded.grading_notes,
  license = excluded.license,
  source = excluded.source,
  attribution = excluded.attribution,
  status = excluded.status,
  updated_at = excluded.updated_at;

--------------------------------------------------
-- 集合
--------------------------------------------------

INSERT INTO problems
  (id, slug, title, difficulty, statement_tex, answer_tex, explanation_tex, grading_notes, license, source, attribution, status, content_hash, created_at, updated_at)
VALUES
  (
    '01980000-0000-7000-8000-000000000319',
    'shiki-019',
    '集合の共通部分・和集合・補集合',
    2,
    '全体集合 $U = \{1, 2, 3, \dots, 10\}$ の部分集合として、$10$ 以下の正の偶数全体の集合 $A$ と、$10$ 以下の正の $3$ の倍数全体の集合 $B$ を考える。次の集合を求めよ。

(1) $A \cap B$
(2) $A \cup B$
(3) $\overline{A} \cap B$',
    '(1) $\{6\}$
(2) $\{2, 3, 4, 6, 8, 9, 10\}$
(3) $\{3, 9\}$',
    '要素を書き出すと
$$A = \{2, 4, 6, 8, 10\}, \quad B = \{3, 6, 9\}$$

(1) 両方に属する要素なので
$$A \cap B = \{6\}$$

(2) 少なくとも一方に属する要素なので
$$A \cup B = \{2, 3, 4, 6, 8, 9, 10\}$$

(3) $\overline{A} = \{1, 3, 5, 7, 9\}$ だから
$$\overline{A} \cap B = \{3, 9\}$$
（$B$ の要素のうち $A$ に属さないもの、と考えてもよい）',
    'A と B の要素の書き出しが正しいかをまず確認してください。要素の漏れや混入は calculation として指摘してください。(3) で補集合を取る対象を誤り B̄ ∩ A などを求めている場合は misconception として指摘してください。集合を要素の羅列で答えず個数などを答えている場合は notation として指摘してください。ベン図による整理があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000320',
    'shiki-020',
    'ド・モルガンの法則と要素の個数',
    3,
    '$20$ 以下の自然数全体を全体集合 $U$ とし、そのうち $4$ の倍数全体の集合を $A$、$6$ の倍数全体の集合を $B$ とする。

(1) $A \cap B$ を求めよ。
(2) $\overline{A} \cup \overline{B}$ の要素の個数を求めよ。',
    '(1) $\{12\}$
(2) $19$ 個',
    '(1) 要素を書き出すと
$$A = \{4, 8, 12, 16, 20\}, \quad B = \{6, 12, 18\}$$
$A \cap B$ は $4$ と $6$ の公倍数、すなわち $12$ の倍数のうち $20$ 以下のものだから
$$A \cap B = \{12\}$$

(2) ド・モルガンの法則より
$$\overline{A} \cup \overline{B} = \overline{A \cap B}$$
$U$ の要素は $20$ 個、$A \cap B$ の要素は $1$ 個なので、求める個数は
$$20 - 1 = 19$$',
    '(2) でド・モルガンの法則により A∩B の補集合へ言い換えられているかを確認してください。Ā と B̄ をそれぞれ書き出して和集合を数える方法でも正しければ正解ですが、ド・モルガンの法則を使うと速いことを別解として紹介してください。A∩B を 4 と 6 の公倍数でなく単に 24 の倍数などとしている場合は misconception として指摘してください。個数の数え間違いは calculation として指摘してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000321',
    'shiki-021',
    '包含関係と定数の範囲',
    4,
    '実数を要素とする2つの集合 $A = \{x \mid 1 \le x \le 5\}$、$B = \{x \mid k - 1 \le x \le k + 2\}$ がある（$k$ は定数）。$B \subset A$ が成り立つような $k$ の値の範囲を求めよ。',
    '$2 \le k \le 3$',
    '$k - 1 < k + 2$ なので $B$ は空集合にならない。

$B \subset A$ となるのは、$B$ の範囲全体が $A$ の範囲に含まれるとき、すなわち数直線上で
$$1 \le k - 1 \quad かつ \quad k + 2 \le 5$$
が成り立つときである。それぞれ解くと
$$k \ge 2 \quad かつ \quad k \le 3$$
よって
$$2 \le k \le 3$$

（$k = 2$ のとき $B = \{x \mid 1 \le x \le 4\}$、$k = 3$ のとき $B = \{x \mid 2 \le x \le 5\}$ でいずれも $A$ に含まれる）',
    '数直線を使って左端と右端の2つの条件を立てられているかを確認してください。片方の条件しか考えていない場合は incomplete として指摘してください。部分集合の記号 ⊂ は端点の一致を許すので、等号を含めず 2 < k < 3 としている場合は logic として指摘してください。端の値 k = 2, 3 を代入して確かめる検算があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  difficulty = excluded.difficulty,
  statement_tex = excluded.statement_tex,
  answer_tex = excluded.answer_tex,
  explanation_tex = excluded.explanation_tex,
  grading_notes = excluded.grading_notes,
  license = excluded.license,
  source = excluded.source,
  attribution = excluded.attribution,
  status = excluded.status,
  updated_at = excluded.updated_at;

--------------------------------------------------
-- 命題と証明
--------------------------------------------------

INSERT INTO problems
  (id, slug, title, difficulty, statement_tex, answer_tex, explanation_tex, grading_notes, license, source, attribution, status, content_hash, created_at, updated_at)
VALUES
  (
    '01980000-0000-7000-8000-000000000322',
    'shiki-022',
    '必要条件・十分条件',
    2,
    '$x$ は実数とする。次の各文の空欄に当てはまるものを、下の①〜④から1つずつ選べ。

(1) $x = 2$ は $x^2 = 4$ であるための（　）
(2) $x^2 > 0$ は $x > 0$ であるための（　）
(3) $x + 3 = 5$ は $x = 2$ であるための（　）
(4) $x > 0$ は $x^2 = 1$ であるための（　）

① 必要十分条件である
② 必要条件であるが十分条件でない
③ 十分条件であるが必要条件でない
④ 必要条件でも十分条件でもない',
    '(1) ③
(2) ②
(3) ①
(4) ④',
    '「$p$ は $q$ であるための」の形では、$p \Longrightarrow q$ が真なら十分条件、$q \Longrightarrow p$ が真なら必要条件である。

(1) $x = 2 \Longrightarrow x^2 = 4$ は真。逆は偽（反例 $x = -2$）。よって③。

(2) $x^2 > 0 \Longrightarrow x > 0$ は偽（反例 $x = -1$）。逆の $x > 0 \Longrightarrow x^2 > 0$ は真。よって②。

(3) $x + 3 = 5 \iff x = 2$ で両方向とも真。よって①。

(4) $x > 0 \Longrightarrow x^2 = 1$ は偽（反例 $x = 3$）。逆も偽（反例 $x = -1$）。よって④。',
    '各問について、2つの条件の間の含意を両方向で判定できているかを確認してください。偽である方向に反例が添えられていれば高く評価してください。必要条件と十分条件を取り違えている（矢印の向きと用語の対応の誤り）場合は misconception として指摘してください。記号だけで答えて理由がない場合は incomplete として指摘してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000323',
    'shiki-023',
    '命題の逆・裏・対偶',
    3,
    '$x$ は実数とする。命題「$x \ge 2 \Longrightarrow x^2 \ge 4$」について、次の問いに答えよ。

(1) この命題の逆・裏・対偶をそれぞれ述べよ。
(2) 元の命題と (1) のそれぞれについて真偽を調べよ。偽の場合は反例を1つ挙げよ。',
    '逆「$x^2 \ge 4 \Longrightarrow x \ge 2$」 偽（反例 $x = -3$）
裏「$x < 2 \Longrightarrow x^2 < 4$」 偽（反例 $x = -3$）
対偶「$x^2 < 4 \Longrightarrow x < 2$」 真
元の命題は真',
    '(1) 命題「$p \Longrightarrow q$」に対して、逆は「$q \Longrightarrow p$」、裏は「$\overline{p} \Longrightarrow \overline{q}$」、対偶は「$\overline{q} \Longrightarrow \overline{p}$」である。$x \ge 2$ の否定は $x < 2$、$x^2 \ge 4$ の否定は $x^2 < 4$ であることに注意する。

(2) 元の命題は真（$x \ge 2 > 0$ の両辺を2乗してよい）。

逆「$x^2 \ge 4 \Longrightarrow x \ge 2$」は偽。反例は $x = -3$（$x^2 = 9 \ge 4$ だが $x < 2$）。

裏「$x < 2 \Longrightarrow x^2 < 4$」は偽。反例は同じく $x = -3$。

対偶「$x^2 < 4 \Longrightarrow x < 2$」は真。$x^2 < 4$ なら $-2 < x < 2$ だから $x < 2$ である。元の命題と対偶の真偽は必ず一致することからも真とわかる。

なお、逆と裏は互いに対偶の関係にあるので真偽が一致する。',
    'x ≧ 2 の否定を x ≦ 2 としている場合は否定の誤りなので misconception として指摘してください。偽と判定した命題に反例がない場合は incomplete として指摘してください。逆と裏の真偽が食い違っている解答は互いに対偶なので矛盾であることを logic として指摘してください。対偶の真偽を元の命題との一致で説明していても正解です。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000324',
    'shiki-024',
    '背理法による無理数の証明',
    4,
    '$\sqrt{2}$ が無理数であることを用いて、$3 + 2\sqrt{2}$ が無理数であることを証明せよ。',
    '解説の証明を参照（$3 + 2\sqrt{2}$ を有理数と仮定すると $\sqrt{2}$ が有理数となり矛盾する）',
    '背理法で示す。

$3 + 2\sqrt{2}$ が有理数であると仮定し、$3 + 2\sqrt{2} = r$（$r$ は有理数）とおく。これを変形すると
$$\sqrt{2} = \frac{r - 3}{2}$$
有理数どうしの差・商（$0$ で割る場合を除く）は有理数なので、右辺 $\dfrac{r - 3}{2}$ は有理数である。

これは $\sqrt{2}$ が無理数であることに矛盾する。

よって $3 + 2\sqrt{2}$ は無理数である。',
    '「3 + 2√2 が有理数であると仮定する」という背理法の仮定が明示されているかを確認してください。仮定の明示がない場合は logic として指摘してください。√2 を有理数の式で表して矛盾を導く流れになっているかを確認してください。r = p/q（p, q は整数）とおいて議論する形式も正解です。有理数が四則演算で閉じていることへの言及がなくても変形が正しければ正解とします。結論の一文が欠けている場合は incomplete として指摘してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  difficulty = excluded.difficulty,
  statement_tex = excluded.statement_tex,
  answer_tex = excluded.answer_tex,
  explanation_tex = excluded.explanation_tex,
  grading_notes = excluded.grading_notes,
  license = excluded.license,
  source = excluded.source,
  attribution = excluded.attribution,
  status = excluded.status,
  updated_at = excluded.updated_at;

--------------------------------------------------
-- 他単元のサンプル問題（自作 CC BY-SA 4.0）
--------------------------------------------------

INSERT INTO problems
  (id, slug, title, difficulty, statement_tex, answer_tex, explanation_tex, grading_notes, license, source, attribution, status, content_hash, created_at, updated_at)
VALUES
  (
    '01980000-0000-7000-8000-000000000202',
    'nijikansu-001',
    '区間における二次関数の最大・最小',
    3,
    '関数 $y = x^2 - 4x + 1$（$0 \le x \le 3$）の最大値と最小値を求めよ。',
    '最大値は $x = 0$ のとき $1$、最小値は $x = 2$ のとき $-3$',
    '平方完成すると
$$y = (x - 2)^2 - 3$$
軸は $x = 2$ で、区間 $0 \le x \le 3$ に含まれる。

したがって最小値は頂点でとり、$x = 2$ のとき $y = -3$。

最大値は軸から遠い方の端点でとる。$x = 0$ のとき $y = 1$、$x = 3$ のとき $y = -2$ なので、最大値は $x = 0$ のとき $1$。',
    '平方完成が正しいかを確認してください。軸が区間内にあることへの言及がないまま最小値を決めている場合は logic として指摘してください。両端点の値を比較せずに最大値を決めている場合も logic です。答えだけで途中の根拠がない場合は incomplete として指摘してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000203',
    'kakuritsu-001',
    '2つのさいころと5の倍数',
    3,
    '大小2個のさいころを同時に投げるとき、出た目の和が5の倍数になる確率を求めよ。',
    '$\dfrac{7}{36}$',
    '目の出方は全部で $6 \times 6 = 36$ 通り。

和が5になるのは $(1,4), (2,3), (3,2), (4,1)$ の4通り。
和が10になるのは $(4,6), (5,5), (6,4)$ の3通り。

和が5の倍数になるのは $4 + 3 = 7$ 通りなので、求める確率は
$$\frac{7}{36}$$',
    '全事象が36通りであることの明示を確認してください。数え上げの漏れや重複（特に (5,5) の扱い）は calculation として指摘してください。大小のさいころを区別せずに数えている場合は misconception として指摘してください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  ),
  (
    '01980000-0000-7000-8000-000000000204',
    'seisu-001',
    '平方数になる条件',
    4,
    '$\sqrt{n^2 + 24}$ が整数となるような自然数 $n$ をすべて求めよ。',
    '$n = 1, 5$',
    '$\sqrt{n^2 + 24} = m$（$m$ は正の整数）とおくと $m^2 = n^2 + 24$ より
$$(m - n)(m + n) = 24$$
$m - n$ と $m + n$ の偶奇は一致し、積が24（偶数）なのでともに偶数である。$0 < m - n < m + n$ に注意して
$$(m - n, m + n) = (2, 12), (4, 6)$$
これを解くと $(m, n) = (7, 5), (5, 1)$。

よって $n = 1, 5$（実際 $n=1$ で $\sqrt{25}=5$、$n=5$ で $\sqrt{49}=7$）。',
    'm^2 - n^2 = 24 と置いて積の形に持ち込む方針を確認してください。約数の組 (1,24) や (3,8) を検討していても、偶奇の議論などで正しく除外できていれば正解です。除外の理由が書かれていない場合は logic として指摘してください。答えの検算があれば褒めてください。',
    'CC-BY-SA-4.0',
    'original',
    NULL,
    'published',
    NULL,
    unixepoch(),
    unixepoch()
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  difficulty = excluded.difficulty,
  statement_tex = excluded.statement_tex,
  answer_tex = excluded.answer_tex,
  explanation_tex = excluded.explanation_tex,
  grading_notes = excluded.grading_notes,
  license = excluded.license,
  source = excluded.source,
  attribution = excluded.attribution,
  status = excluded.status,
  updated_at = excluded.updated_at;

--------------------------------------------------
-- 問題と項目の紐付け（項目タグに付けると単元ページでグルーピングされる）
--------------------------------------------------

DELETE FROM problem_tags WHERE problem_id IN (
  '01980000-0000-7000-8000-000000000201',
  '01980000-0000-7000-8000-000000000202',
  '01980000-0000-7000-8000-000000000203',
  '01980000-0000-7000-8000-000000000204',
  '01980000-0000-7000-8000-000000000302',
  '01980000-0000-7000-8000-000000000303',
  '01980000-0000-7000-8000-000000000304',
  '01980000-0000-7000-8000-000000000305',
  '01980000-0000-7000-8000-000000000306',
  '01980000-0000-7000-8000-000000000307',
  '01980000-0000-7000-8000-000000000308',
  '01980000-0000-7000-8000-000000000309',
  '01980000-0000-7000-8000-000000000310',
  '01980000-0000-7000-8000-000000000311',
  '01980000-0000-7000-8000-000000000312',
  '01980000-0000-7000-8000-000000000313',
  '01980000-0000-7000-8000-000000000314',
  '01980000-0000-7000-8000-000000000315',
  '01980000-0000-7000-8000-000000000316',
  '01980000-0000-7000-8000-000000000317',
  '01980000-0000-7000-8000-000000000318',
  '01980000-0000-7000-8000-000000000319',
  '01980000-0000-7000-8000-000000000320',
  '01980000-0000-7000-8000-000000000321',
  '01980000-0000-7000-8000-000000000322',
  '01980000-0000-7000-8000-000000000323',
  '01980000-0000-7000-8000-000000000324'
);

INSERT INTO problem_tags (problem_id, tag_id) VALUES
  ('01980000-0000-7000-8000-000000000302', '01980000-0000-7000-8000-000000000121'),
  ('01980000-0000-7000-8000-000000000303', '01980000-0000-7000-8000-000000000121'),
  ('01980000-0000-7000-8000-000000000304', '01980000-0000-7000-8000-000000000121'),
  ('01980000-0000-7000-8000-000000000305', '01980000-0000-7000-8000-000000000111'),
  ('01980000-0000-7000-8000-000000000306', '01980000-0000-7000-8000-000000000111'),
  ('01980000-0000-7000-8000-000000000201', '01980000-0000-7000-8000-000000000111'),
  ('01980000-0000-7000-8000-000000000307', '01980000-0000-7000-8000-000000000111'),
  ('01980000-0000-7000-8000-000000000308', '01980000-0000-7000-8000-000000000122'),
  ('01980000-0000-7000-8000-000000000309', '01980000-0000-7000-8000-000000000122'),
  ('01980000-0000-7000-8000-000000000310', '01980000-0000-7000-8000-000000000122'),
  ('01980000-0000-7000-8000-000000000311', '01980000-0000-7000-8000-000000000122'),
  ('01980000-0000-7000-8000-000000000312', '01980000-0000-7000-8000-000000000123'),
  ('01980000-0000-7000-8000-000000000313', '01980000-0000-7000-8000-000000000123'),
  ('01980000-0000-7000-8000-000000000314', '01980000-0000-7000-8000-000000000123'),
  ('01980000-0000-7000-8000-000000000315', '01980000-0000-7000-8000-000000000123'),
  ('01980000-0000-7000-8000-000000000316', '01980000-0000-7000-8000-000000000124'),
  ('01980000-0000-7000-8000-000000000317', '01980000-0000-7000-8000-000000000124'),
  ('01980000-0000-7000-8000-000000000318', '01980000-0000-7000-8000-000000000124'),
  ('01980000-0000-7000-8000-000000000319', '01980000-0000-7000-8000-000000000125'),
  ('01980000-0000-7000-8000-000000000320', '01980000-0000-7000-8000-000000000125'),
  ('01980000-0000-7000-8000-000000000321', '01980000-0000-7000-8000-000000000125'),
  ('01980000-0000-7000-8000-000000000322', '01980000-0000-7000-8000-000000000126'),
  ('01980000-0000-7000-8000-000000000323', '01980000-0000-7000-8000-000000000126'),
  ('01980000-0000-7000-8000-000000000324', '01980000-0000-7000-8000-000000000126'),
  ('01980000-0000-7000-8000-000000000202', '01980000-0000-7000-8000-000000000112'),
  ('01980000-0000-7000-8000-000000000203', '01980000-0000-7000-8000-000000000113'),
  ('01980000-0000-7000-8000-000000000204', '01980000-0000-7000-8000-000000000114');
