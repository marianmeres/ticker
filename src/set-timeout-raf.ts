import { getRaf } from './get-raf.js';

export function setTimeoutRAF(cb: CallableFunction, delay: number) {
	const { requestAnimationFrame, cancelAnimationFrame } = getRaf();
	const start = performance.now();

	function on_frame(timestamp) {
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
