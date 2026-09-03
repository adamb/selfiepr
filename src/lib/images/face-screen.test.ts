import { describe, it, expect } from "vitest";
import {
	evaluateFaceDetections,
	MIN_FACE_AREA_RATIO,
	MIN_FACE_SIDE_RATIO,
	DOMINANT_FACE_AREA_RATIO
} from "./face-screen.js";

describe("evaluateFaceDetections", () => {
	const W = 1000;
	const H = 1000;

	it("fails with no clear face when empty", () => {
		const r = evaluateFaceDetections([], W, H);
		expect(r.pass).toBe(false);
		expect(r.reason).toBe("no clear face");
	});

	it("fails with no clear face for invalid image size", () => {
		const r = evaluateFaceDetections([{ width: 200, height: 200 }], 0, H);
		expect(r.pass).toBe(false);
		expect(r.reason).toBe("no clear face");
	});

	it("passes a single large enough face via area rule", () => {
		const r = evaluateFaceDetections([{ width: 200, height: 200 }], W, H);
		expect(r.pass).toBe(true);
		expect(r.reason).toBeUndefined();
	});

	it("passes via min-side rule when area is slightly under threshold", () => {
		const side = Math.ceil(MIN_FACE_SIDE_RATIO * Math.min(W, H));
		const thin = Math.max(1, Math.floor((MIN_FACE_AREA_RATIO * W * H) / side) - 1);
		const r = evaluateFaceDetections([{ width: side, height: thin }], W, H);
		expect(side / Math.min(W, H)).toBeGreaterThanOrEqual(MIN_FACE_SIDE_RATIO);
		expect(r.pass).toBe(true);
	});

	it("fails face too small when both area and side are below thresholds", () => {
		const r = evaluateFaceDetections([{ width: 50, height: 50 }], W, H);
		expect(r.pass).toBe(false);
		expect(r.reason).toBe("face too small");
	});

	it("fails multiple faces when neither is dominant", () => {
		const r = evaluateFaceDetections(
			[
				{ width: 200, height: 200 },
				{ width: 180, height: 180 }
			],
			W,
			H
		);
		expect(r.pass).toBe(false);
		expect(r.reason).toBe("multiple faces");
	});

	it("passes when one face is clearly dominant (>= 2x area)", () => {
		const r = evaluateFaceDetections(
			[
				{ width: 300, height: 300 },
				{ width: 100, height: 100 }
			],
			W,
			H
		);
		const ratio = (300 * 300) / (100 * 100);
		expect(ratio).toBeGreaterThanOrEqual(DOMINANT_FACE_AREA_RATIO);
		expect(r.pass).toBe(true);
	});

	it("exports expected threshold constants", () => {
		expect(MIN_FACE_AREA_RATIO).toBe(0.04);
		expect(MIN_FACE_SIDE_RATIO).toBe(0.15);
		expect(DOMINANT_FACE_AREA_RATIO).toBe(2);
	});
});

