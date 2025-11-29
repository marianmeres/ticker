import { isBrowser } from "./is-browser.ts";

/**
 * RAF interface returned by `getRaf()`.
 */
export interface RafInterface {
	requestAnimationFrame: (cb: (timestamp: number) => void) => number;
	cancelAnimationFrame: (handle: number) => void;
}

/**
 * Returns an object with `requestAnimationFrame` and `cancelAnimationFrame` functions.
 *
 * In browser environments, returns the native implementations bound to `globalThis`.
 * In non-browser environments (Deno, Node.js), returns a polyfill using `setTimeout`
 * that approximates 60Hz timing.
 *
 * This is a singleton - the same instance is returned on subsequent calls.
 *
 * @returns An object with `requestAnimationFrame` and `cancelAnimationFrame` methods.
 */
export const getRaf: () => RafInterface = (() => {
	// singleton
	let instance: RafInterface | null = null;

	return (): RafInterface => {
		if (instance) return instance;

		if (
			isBrowser() &&
			globalThis.requestAnimationFrame &&
			globalThis.cancelAnimationFrame
		) {
			instance = {
				requestAnimationFrame: globalThis.requestAnimationFrame.bind(globalThis),
				cancelAnimationFrame: globalThis.cancelAnimationFrame.bind(globalThis),
			};
			return instance;
		}

		// Server polyfill using setTimeout
		// Store both callback and timer handle for proper cleanup
		const pendingFrames = new Map<
			number,
			{
				callback: (timestamp: number) => void;
				timerId: ReturnType<typeof setTimeout>;
			}
		>();
		let nextCallbackId = 0;

		instance = {
			requestAnimationFrame(callback: (timestamp: number) => void): number {
				const callbackId = ++nextCallbackId;

				// Wrap around to prevent overflow (though unlikely in practice)
				if (nextCallbackId >= Number.MAX_SAFE_INTEGER) {
					nextCallbackId = 0;
				}

				const timerId = setTimeout(() => {
					const frame = pendingFrames.get(callbackId);
					if (frame) {
						pendingFrames.delete(callbackId);
						callback(Date.now());
					}
				}, 1000 / 60);

				pendingFrames.set(callbackId, { callback, timerId });
				return callbackId;
			},

			cancelAnimationFrame(callbackId: number): void {
				const frame = pendingFrames.get(callbackId);
				if (frame) {
					clearTimeout(frame.timerId);
					pendingFrames.delete(callbackId);
				}
			},
		};

		return instance;
	};
})();
