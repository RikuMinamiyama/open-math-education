import katex from "katex";
import { useMemo } from "react";

type Segment = { kind: "text" | "inline" | "display"; value: string };

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

function renderTex(tex: string, displayMode: boolean): string {
	return katex.renderToString(tex, { displayMode, fleqn: displayMode, throwOnError: false });
}

export function MathText({ text, className }: { text: string; className?: string }) {
	const segments = useMemo(() => tokenize(text), [text]);
	return (
		<div className={`whitespace-pre-wrap leading-relaxed ${className ?? ""}`}>
			{segments.map((seg, i) =>
				seg.kind === "text" ? (
					<span key={i}>{seg.value}</span>
				) : seg.kind === "display" ? (
					<div key={i} dangerouslySetInnerHTML={{ __html: renderTex(seg.value, true) }} />
				) : (
					<span key={i} dangerouslySetInnerHTML={{ __html: renderTex(seg.value, false) }} />
				),
			)}
		</div>
	);
}
