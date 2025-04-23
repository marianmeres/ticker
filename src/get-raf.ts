import { isBrowser } from './is-browser.js';

export const getRaf = (() => {
	// singleton
	let instance: any;

	return (): {
		requestAnimationFrame: (cb: (timeout: number) => void) => number;
		cancelAnimationFrame: (handle: number) => void;
	} => {
		if (instance) return instance;

		if (isBrowser() && window.requestAnimationFrame && window.cancelAnimationFrame) {
			instance = {
				requestAnimationFrame: window.requestAnimationFrame.bind(window),
				cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
			};
			return instance;
		}

		// Server polyfill...
		const callbacks = new Map();
		let nextCallbackId = 0;

		instance = {
			requestAnimationFrame(callback: (timeout: number) => void) {
				const callbackId = ++nextCallbackId;
				callbacks.set(callbackId, callback);

				setTimeout(() => {
					if (callbacks.has(callbackId)) {
						const now = Date.now();
						callback(now);
						callbacks.delete(callbackId);
					}
				}, 1000 / 60);

				return callbackId;
			},

			cancelAnimationFrame(callbackId: number) {
				callbacks.delete(callbackId);
			},
		};

		return instance;
	};
})();
