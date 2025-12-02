import { getRaf } from "./get-raf.ts";

/**
 * A `setTimeout`-like function that uses `requestAnimationFrame` for timing.
 *
 * This is useful for delays that should sync with the browser's repaint cycle,
 * providing smoother visual updates compared to regular `setTimeout`.
 *
 * @param cb - The callback function to execute after the delay.
 * @param delay - The delay in milliseconds before executing the callback.
 * @returns A cancel function that can be called to cancel the pending callback.
 *
 * @example
 * ```typescript
 * const cancel = setTimeoutRAF(() => {
 *   console.log('Executed after ~100ms, synced with RAF');
 * }, 100);
 *
 * // To cancel before execution:
 * cancel();
 * ```
 */
export function setTimeoutRAF(
	cb: () => void,
	delay: number,
): () => void {
	const { requestAnimationFrame, cancelAnimationFrame } = getRaf();
	let start: number | null = null;

	function on_frame(timestamp: number): void {
		// Capture the first RAF timestamp as baseline (not Date.now())
		// This ensures compatibility with browser's DOMHighResTimeStamp
		if (start === null) {
			start = timestamp;
		}
		const elapsed = timestamp - start;
		if (elapsed >= delay) {
			cb();
		} else {
			requestId = requestAnimationFrame(on_frame);
		}
	}

	let requestId = requestAnimationFrame(on_frame);

	// Return a function to cancel the timeout
	return () => cancelAnimationFrame(requestId);
}
