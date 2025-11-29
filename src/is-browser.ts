/**
 * Detects if the code is running in a browser environment.
 *
 * Checks for the presence of `window`, `document`, and that `globalThis === window`.
 * This helps distinguish browsers from environments like Deno or Node.js that may
 * have partial DOM implementations.
 *
 * @returns `true` if running in a browser, `false` otherwise.
 */
export function isBrowser(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof document !== "undefined" &&
		globalThis === window
	);
}
