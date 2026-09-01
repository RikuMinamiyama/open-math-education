const MAX_EDGE_PX = 2048;
const JPEG_QUALITY = 0.82;
export const MAX_ANSWER_IMAGE_BYTES = 5 * 1024 * 1024;

export async function compressAnswerImage(file: File): Promise<File> {
	if (file.size === 0) {
		throw new Error("空の画像はアップロードできません");
	}

	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		throw new Error("この画像は読み取れませんでした。JPEGまたはPNGで保存してからやり直してください");
	}

	try {
		const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error("画像の圧縮に失敗しました");
		}
		ctx.drawImage(bitmap, 0, 0, width, height);
		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
		if (!blob) {
			throw new Error("画像の圧縮に失敗しました");
		}
		if (blob.size > MAX_ANSWER_IMAGE_BYTES) {
			throw new Error("画像が大きすぎます。もう少し離して撮影するか、解像度を下げてください");
		}
		const name = file.name.replace(/\.[^.]+$/, "") || "answer";
		return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
	} finally {
		bitmap.close();
	}
}
