/**
 * Client-side clear-face screening via MediaPipe FaceDetector.
 *
 * Pass rules (documented for product / QA):
 * 1. At least one face must be detected; else fail with no clear face.
 * 2. Prefer a single face. If multiple faces are found, fail with
 *    multiple faces unless one face is clearly dominant
 *    (>= ~2x the bounding-box area of the next-largest face). Only the
 *    dominant face is then evaluated for size.
 * 3. The chosen face must cover a meaningful portion of the image:
 *    face area >= 4% of image area, OR the face shorter side >= 15% of
 *    min(image width, image height); else fail with face too small.
 *
 * The detector is lazy-initialized once (WASM + model from CDN).
 * Server-side training cannot re-run this ML; API only enforces counts.
 */

import { FaceDetector, FilesetResolver, type Detection } from "@mediapipe/tasks-vision";

export type FaceScreenReason = "no clear face" | "multiple faces" | "face too small";

export interface FaceScreenResult {
	pass: boolean;
	reason?: FaceScreenReason;
}

export const MIN_FACE_AREA_RATIO = 0.04;
export const MIN_FACE_SIDE_RATIO = 0.15;
export const DOMINANT_FACE_AREA_RATIO = 2;

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

let detectorPromise: Promise<FaceDetector> | null = null;

export function _resetFaceDetectorForTests(): void {
	detectorPromise = null;
}

export async function getFaceDetector(): Promise<FaceDetector> {
	if (!detectorPromise) {
		detectorPromise = (async () => {
			const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
			return FaceDetector.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: MODEL_URL
				},
				runningMode: "IMAGE",
				minDetectionConfidence: 0.5
			});
		})().catch((err) => {
			detectorPromise = null;
			throw err;
		});
	}
	return detectorPromise;
}

function faceArea(box: { width: number; height: number }): number {
	return Math.max(0, box.width) * Math.max(0, box.height);
}

export function evaluateFaceDetections(
	detections: Array<{ width: number; height: number }>,
	imageWidth: number,
	imageHeight: number
): FaceScreenResult {
	if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) {
		return { pass: false, reason: "no clear face" };
	}

	const boxes = detections.filter((d) => d.width > 0 && d.height > 0);
	if (boxes.length === 0) {
		return { pass: false, reason: "no clear face" };
	}

	const sorted = [...boxes].sort((a, b) => faceArea(b) - faceArea(a));
	const primary = sorted[0];
	const primaryArea = faceArea(primary);

	if (sorted.length > 1) {
		const secondArea = faceArea(sorted[1]);
		if (secondArea > 0 && primaryArea < DOMINANT_FACE_AREA_RATIO * secondArea) {
			return { pass: false, reason: "multiple faces" };
		}
	}

	const imageArea = imageWidth * imageHeight;
	const areaOk = primaryArea / imageArea >= MIN_FACE_AREA_RATIO;
	const minSide = Math.min(primary.width, primary.height);
	const sideOk = minSide / Math.min(imageWidth, imageHeight) >= MIN_FACE_SIDE_RATIO;

	if (!areaOk && !sideOk) {
		return { pass: false, reason: "face too small" };
	}

	return { pass: true };
}

function boxesFromDetections(detections: Detection[]): Array<{ width: number; height: number }> {
	return detections
		.map((d) => d.boundingBox)
		.filter((b): b is NonNullable<typeof b> => !!b)
		.map((b) => ({ width: b.width, height: b.height }));
}

export async function screenClearFace(file: File | Blob): Promise<FaceScreenResult> {
	let bitmap: ImageBitmap | null = null;
	try {
		const detector = await getFaceDetector();
		bitmap = await createImageBitmap(file);
		const result = detector.detect(bitmap);
		return evaluateFaceDetections(
			boxesFromDetections(result.detections ?? []),
			bitmap.width,
			bitmap.height
		);
	} catch {
		return { pass: false, reason: "no clear face" };
	} finally {
		bitmap?.close();
	}
}

