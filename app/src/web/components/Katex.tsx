import katex from "katex";
import { useMemo } from "react";

type Inline = { kind: "text"; value: string } | { kind: "inline"; value: string };
type Segment = Inline | { kind: "display"; value: string };

// 行単位のブロック
// gapBeforeは直前の空行の数（1つにつき0.5emの余白になる）
type Block =
	| { kind: "line"; parts: Inline[]; gapBefore: number }
	| { kind: "display"; value: string; gapBefore: number };

// $...$ と $$...$$ を数式として切り出す
function tokenize(text: string): Segment[] {
	const segments: Segment[] = [];
	const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
	let lastIndex = 0;
	for (const match of text.matchAll(pattern)) {
		if (match.index > lastIndex) {
			segments.push({ kind: "text", value: text.slice(lastIndex, match.index) });
		}
		if (match[1] !== undefined) {
			segments.push({ kind: "display", value: match[1] });
		} else {
			segments.push({ kind: "inline", value: match[2] });
		}
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) {
		segments.push({ kind: "text", value: text.slice(lastIndex) });
	}
	return segments;
}

// 改行で行に分割しブロック列にまとめる
// 最初の改行は行送りとして余白に数えず、連続した分だけgapBeforeに積む
// $$...$$ を独立した行に書いたときの前後の改行も同様に余白へ加算しない
function toBlocks(segments: Segment[]): Block[] {
	type Token = Segment | { kind: "break" };
	const tokens: Token[] = [];
	for (const seg of segments) {
		if (seg.kind !== "text") {
			tokens.push(seg);
			continue;
		}
		seg.value.split("\n").forEach((line, i) => {
			if (i > 0) tokens.push({ kind: "break" });
			// 空白だけの行は空行扱い
			// 数学書の表記に合わせ読点は全角コンマに置換する（作成者ごとの揺れを描画側で吸収）
			if (line.trim().length > 0) tokens.push({ kind: "text", value: line.replaceAll("、", "，") });
		});
	}

	const blocks: Block[] = [];
	let line: Inline[] | null = null;
	let breaks = 0;
	const gapBefore = () => (blocks.length > 0 ? Math.max(0, breaks - 1) : 0);
	for (const token of tokens) {
		if (token.kind === "break") {
			breaks += 1;
			line = null;
			continue;
		}
		if (token.kind === "display") {
			blocks.push({ kind: "display", value: token.value, gapBefore: gapBefore() });
			line = null;
			breaks = 0;
			continue;
		}
		if (!line) {
			line = [];
			blocks.push({ kind: "line", parts: line, gapBefore: gapBefore() });
			breaks = 0;
		}
		line.push(token);
	}
	return blocks;
}

function renderTex(tex: string, displayMode: boolean): string {
	return katex.renderToString(tex, { displayMode, fleqn: displayMode, throwOnError: false });
}

export function MathText({ text, className }: { text: string; className?: string }) {
	const blocks = useMemo(() => toBlocks(tokenize(text)), [text]);
	return (
		<div className={`leading-relaxed ${className ?? ""}`}>
			{blocks.map((block, i) => {
				const style = block.gapBefore > 0 ? { marginTop: `${block.gapBefore * 0.5}em` } : undefined;
				return block.kind === "display" ? (
					<div key={i} style={style} dangerouslySetInnerHTML={{ __html: renderTex(block.value, true) }} />
				) : (
					<div key={i} style={style} className="whitespace-pre-wrap">
						{block.parts.map((part, j) =>
							part.kind === "text" ? (
								<span key={j}>{part.value}</span>
							) : (
								<span key={j} dangerouslySetInnerHTML={{ __html: renderTex(part.value, false) }} />
							),
						)}
					</div>
				);
			})}
		</div>
	);
}
