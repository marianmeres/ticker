# API Reference

Complete API documentation for `@marianmeres/ticker`.

## Table of Contents

- [Factory Functions](#factory-functions)
  - [createTicker](#createtickerinterval-startoroptions-logger-ticker)
  - [createTickerRAF](#createtickerrafinterval-startoroptions-logger-ticker)
  - [createDelayedWorkerTicker](#createdelayedworkertickerworker-interval-startoroptions-delayedworkerticker)
- [Interfaces](#interfaces)
  - [Ticker](#ticker)
  - [DelayedWorkerTicker](#delayedworkerticker)
  - [DelayedTickerVal](#delayedtickerval)
  - [TickerOptions](#tickeroptions)
  - [DelayedWorkerTickerOptions](#delayedworkertickeroptions)
  - [RafInterface](#rafinterface)
- [Types](#types)
  - [Interval](#interval)
  - [ErrorHandler](#errorhandler)
- [Helper Functions](#helper-functions)
  - [isBrowser](#isbrowser-boolean)
  - [getRaf](#getraf-rafinterface)
  - [setTimeoutRAF](#settimeoutrafcb-delay-cancel)

---

## Factory Functions

### `createTicker(interval?, startOrOptions?, logger?): Ticker`

Creates a ticker that emits timestamps at regular intervals using recursive `setTimeout`
with drift correction.

**Signatures:**

```typescript
// Options object signature (recommended)
createTicker(interval?: Interval, options?: TickerOptions): Ticker

// Legacy signature (for backwards compatibility)
createTicker(interval?: Interval, start?: boolean, logger?: Function): Ticker
```

**Parameters:**

| Parameter        | Type                       | Default | Description                                                   |
| ---------------- | -------------------------- | ------- | ------------------------------------------------------------- |
| `interval`       | `Interval`                 | `1000`  | Interval in milliseconds, or function returning milliseconds. |
| `startOrOptions` | `boolean \| TickerOptions` | `false` | Whether to start immediately, or an options object.           |
| `logger`         | `Function \| null`         | `null`  | Optional debug logger function (legacy signature only).       |

**Returns:** [`Ticker`](#ticker)

**Examples:**

```typescript
import { createTicker } from "@marianmeres/ticker";

// Basic usage with options object
const ticker = createTicker(1000, { start: true });

// With error handling
const ticker = createTicker(1000, {
	start: true,
	onError: (error) => console.error("Subscriber error:", error),
});

// Legacy signature
const ticker = createTicker(1000, true, console.log);

// Subscribe and control
const unsub = ticker.subscribe((timestamp) => {
	if (timestamp) {
		console.log("Tick at", timestamp);
	} else {
		console.log("Ticker stopped");
	}
});

ticker.start();
// later...
ticker.stop();
unsub();
```

---

### `createTickerRAF(interval?, startOrOptions?, logger?): Ticker`

Creates a ticker that uses `requestAnimationFrame` for timing. Useful for animations or
visual updates that should sync with the browser's repaint cycle.

The minimum effective interval is ~16.67ms (60Hz). Using smaller intervals will trigger a
warning.

**Signatures:**

```typescript
// Options object signature (recommended)
createTickerRAF(interval?: Interval, options?: TickerOptions): Ticker

// Legacy signature (for backwards compatibility)
createTickerRAF(interval?: Interval, start?: boolean, logger?: Function): Ticker
```

**Parameters:**

Same as [`createTicker`](#createtickerinterval-startoroptions-logger-ticker).

**Returns:** [`Ticker`](#ticker)

**Examples:**

```typescript
import { createTickerRAF } from "@marianmeres/ticker";

// 60fps animation ticker
const ticker = createTickerRAF(1000 / 60, { start: true });

ticker.subscribe((timestamp) => {
	if (timestamp) updateAnimation();
});
```

**Note:** In non-browser environments (Deno, Node.js), a polyfill using `setTimeout` is
automatically used.

---

### `createDelayedWorkerTicker(worker, interval?, startOrOptions?): DelayedWorkerTicker`

Creates a ticker for async workers that waits for the work to complete before scheduling
the next tick.

Unlike `createTicker`, this guarantees a delay _between_ worker calls, not a fixed
frequency. This is ideal for periodic async operations like API polling where you want to
avoid overlapping requests.

**Signatures:**

```typescript
// Options object signature (recommended)
createDelayedWorkerTicker(
  worker: (previous: DelayedTickerVal) => Promise<unknown> | unknown,
  interval?: Interval,
  options?: DelayedWorkerTickerOptions
): DelayedWorkerTicker

// Legacy signature (for backwards compatibility)
createDelayedWorkerTicker(
  worker: (previous: DelayedTickerVal) => Promise<unknown> | unknown,
  interval?: Interval,
  start?: boolean
): DelayedWorkerTicker
```

**Parameters:**

| Parameter        | Type                                           | Default | Description                                          |
| ---------------- | ---------------------------------------------- | ------- | ---------------------------------------------------- |
| `worker`         | `(previous: DelayedTickerVal) => Promise<any>` | —       | Async or sync function to execute on each tick.      |
| `interval`       | `Interval`                                     | `1000`  | Delay in ms after worker completes before next call. |
| `startOrOptions` | `boolean \| DelayedWorkerTickerOptions`        | `false` | Whether to start immediately, or an options object.  |

**Returns:** [`DelayedWorkerTicker`](#delayedworkerticker)

**Examples:**

```typescript
import { createDelayedWorkerTicker } from "@marianmeres/ticker";

const ticker = createDelayedWorkerTicker(
	async () => {
		const response = await fetch("/api/data");
		return response.json();
	},
	5000, // 5 second delay after each fetch
	{ start: true },
);

ticker.subscribe(({ started, finished, error, result }) => {
	if (started && !finished) {
		console.log("Fetching...");
	} else if (finished && !error) {
		console.log("Got data:", result);
	} else if (error) {
		console.error("Fetch failed:", error);
	}
});
```

---

## Interfaces

### `Ticker`

Ticker instance returned by `createTicker` and `createTickerRAF`.

```typescript
interface Ticker {
	/**
	 * Subscribe to tick events. The callback receives the current timestamp
	 * (Date.now()) on each tick, or 0 when the ticker is stopped.
	 * Returns an unsubscribe function.
	 */
	subscribe(cb: (timestamp: number) => void): () => void;

	/**
	 * Start the ticker. Returns the ticker instance for chaining.
	 */
	start(): Ticker;

	/**
	 * Stop the ticker and reset state. Returns the ticker instance for chaining.
	 */
	stop(): Ticker;

	/**
	 * Toggle between started and stopped states.
	 * Returns the ticker instance for chaining.
	 */
	toggle(): Ticker;

	/**
	 * Check if the ticker is currently running.
	 */
	isStarted(): boolean;

	/**
	 * Change the interval dynamically. Accepts a number or a function.
	 * Returns the ticker instance for chaining.
	 */
	setInterval(msOrFn: Interval): Ticker;

	/**
	 * Get the current interval value in milliseconds.
	 */
	getInterval(): number;
}
```

---

### `DelayedWorkerTicker`

Ticker instance for async workers, returned by `createDelayedWorkerTicker`.

```typescript
interface DelayedWorkerTicker {
	/**
	 * Subscribe to worker state changes. The callback receives an object with
	 * `started`, `finished`, `error`, and `result` properties.
	 * Returns an unsubscribe function.
	 */
	subscribe(cb: (value: DelayedTickerVal) => void): () => void;

	/**
	 * Start the worker ticker. Returns the ticker instance for chaining.
	 */
	start(): DelayedWorkerTicker;

	/**
	 * Stop the worker ticker. Returns the ticker instance for chaining.
	 */
	stop(): DelayedWorkerTicker;

	/**
	 * Toggle between started and stopped states.
	 * Returns the ticker instance for chaining.
	 */
	toggle(): DelayedWorkerTicker;

	/**
	 * Check if the ticker is currently running.
	 */
	isStarted(): boolean;

	/**
	 * Change the interval dynamically. Accepts a number or a function.
	 * Returns the ticker instance for chaining.
	 */
	setInterval(ms: Interval): DelayedWorkerTicker;

	/**
	 * Get the current interval value in milliseconds.
	 */
	getInterval(): number;
}
```

---

### `DelayedTickerVal`

Value emitted by `DelayedWorkerTicker` on each tick.

```typescript
interface DelayedTickerVal {
	/** Timestamp when the worker started (or 0 if not started) */
	started: number;

	/** Timestamp when the worker finished (or 0 if still running) */
	finished: number;

	/** Error thrown by the worker, if any */
	error: any;

	/** Result returned by the worker, if successful */
	result: any;
}
```

**State interpretation:**

| `started` | `finished` | `error` | Meaning                       |
| --------- | ---------- | ------- | ----------------------------- |
| `0`       | `0`        | `null`  | Ticker stopped or not started |
| `> 0`     | `0`        | `null`  | Worker is currently running   |
| `> 0`     | `> 0`      | `null`  | Worker completed successfully |
| `> 0`     | `> 0`      | truthy  | Worker threw an error         |

---

### `TickerOptions`

Options object for `createTicker` and `createTickerRAF`.

```typescript
interface TickerOptions {
	/** Whether to start the ticker immediately. Defaults to false. */
	start?: boolean;

	/** Optional debug logger function. */
	logger?: ((...args: unknown[]) => void) | null;

	/** Optional error handler for subscriber errors. If not provided, errors are logged to console. */
	onError?: ErrorHandler | null;
}
```

---

### `DelayedWorkerTickerOptions`

Options object for `createDelayedWorkerTicker`.

```typescript
interface DelayedWorkerTickerOptions {
	/** Whether to start the ticker immediately. Defaults to false. */
	start?: boolean;

	/** Optional error handler for subscriber errors. If not provided, errors are logged to console. */
	onError?: ErrorHandler | null;
}
```

---

### `RafInterface`

Interface returned by `getRaf()`.

```typescript
interface RafInterface {
	requestAnimationFrame: (cb: (timestamp: number) => void) => number;
	cancelAnimationFrame: (handle: number) => void;
}
```

---

## Types

### `Interval`

Interval can be a static number of milliseconds or a function that dynamically computes
the interval.

```typescript
type Interval = number | ((previous: number, storeVal: any) => number);
```

**Parameters for function form:**

| Parameter  | Type     | Description                                    |
| ---------- | -------- | ---------------------------------------------- |
| `previous` | `number` | The previous interval value in milliseconds.   |
| `storeVal` | `any`    | The current store value (timestamp or object). |

**Examples:**

```typescript
// Static interval
const ticker = createTicker(1000);

// Exponential backoff
let attempts = 0;
const ticker = createTicker((previousInterval) => {
	return Math.min(1000 * Math.pow(2, attempts++), 30000);
});

// Interval based on result
const ticker = createDelayedWorkerTicker(
	fetchData,
	(prev, val) => val.error ? 10000 : 1000, // Slow down on errors
);
```

---

### `ErrorHandler`

Error handler function type for subscriber errors.

```typescript
type ErrorHandler = (error: unknown) => void;
```

---

## Helper Functions

These are exported for advanced use cases but are primarily for internal use.

### `isBrowser(): boolean`

Detects if the code is running in a browser environment.

Checks for the presence of `window`, `document`, and that `globalThis === window`. This
helps distinguish browsers from environments like Deno or Node.js that may have partial
DOM implementations.

```typescript
import { isBrowser } from "@marianmeres/ticker";

if (isBrowser()) {
	// Browser-specific code
}
```

---

### `getRaf(): RafInterface`

Returns an object with `requestAnimationFrame` and `cancelAnimationFrame` functions.

In browser environments, returns the native implementations bound to `globalThis`. In
non-browser environments (Deno, Node.js), returns a polyfill using `setTimeout` that
approximates 60Hz timing.

This is a singleton - the same instance is returned on subsequent calls.

```typescript
import { getRaf } from "@marianmeres/ticker";

const { requestAnimationFrame, cancelAnimationFrame } = getRaf();

const id = requestAnimationFrame((timestamp) => {
	console.log("Frame at", timestamp);
});

// To cancel:
cancelAnimationFrame(id);
```

---

### `setTimeoutRAF(cb, delay): cancel`

A `setTimeout`-like function that uses `requestAnimationFrame` for timing.

This is useful for delays that should sync with the browser's repaint cycle, providing
smoother visual updates compared to regular `setTimeout`.

**Parameters:**

| Parameter | Type         | Description                                       |
| --------- | ------------ | ------------------------------------------------- |
| `cb`      | `() => void` | The callback function to execute after the delay. |
| `delay`   | `number`     | The delay in milliseconds before executing.       |

**Returns:** `() => void` - A cancel function to abort the pending callback.

```typescript
import { setTimeoutRAF } from "@marianmeres/ticker";

const cancel = setTimeoutRAF(() => {
	console.log("Executed after ~100ms, synced with RAF");
}, 100);

// To cancel before execution:
cancel();
```
