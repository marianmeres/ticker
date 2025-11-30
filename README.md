# @marianmeres/ticker

[![NPM version](https://img.shields.io/npm/v/@marianmeres/ticker)](https://www.npmjs.com/package/@marianmeres/ticker)
[![JSR version](https://jsr.io/badges/@marianmeres/ticker)](https://jsr.io/@marianmeres/ticker)

Do something when it ticks. With a
[store-compatible](https://github.com/marianmeres/store) API.

Under the hood it uses recursive `setTimeout` with interval corrections, so it should
guarantee precise frequency **except** for edge cases where the **synchronous**
subscriber's work cannot keep up with the interval — it will never tick again before the
previous tick finishes.

## Install

```shell
npm i @marianmeres/ticker
```

```shell
deno add jsr:@marianmeres/ticker
```

## Basic Usage

```typescript
import { createTicker } from "@marianmeres/ticker";

// Create a ticker that ticks every 1000 milliseconds
const ticker = createTicker(1000);

// Subscribe to tick events
const unsub = ticker.subscribe((timestamp) => {
	if (timestamp) {
		// Do something on each tick
		console.log("Tick at", timestamp);
	} else {
		// Ticker is stopped (or has not started yet)
		console.log("Ticker stopped");
	}
});

// Start the ticker
ticker.start();

// Later: stop and clean up
ticker.stop();
unsub();
```

## RAF Ticker

For animations or visual updates that should sync with the browser's repaint cycle, use
`createTickerRAF`:

```typescript
import { createTickerRAF } from "@marianmeres/ticker";

const ticker = createTickerRAF(1000 / 60); // ~60fps
ticker.subscribe((timestamp) => {
	if (timestamp) updateAnimation();
});
ticker.start();
```

The RAF ticker uses `requestAnimationFrame` internally, with a polyfill for non-browser
environments. The minimum effective interval is ~16.67ms (60Hz).

## Delayed Worker Ticker

Using a tick signal from a sync ticker for **asynchronous** work (e.g., periodic API
fetching)
[may not be the best choice](https://developer.mozilla.org/en-US/docs/Web/API/setInterval#ensure_that_execution_duration_is_shorter_than_interval_frequency).
For such cases, use `createDelayedWorkerTicker`. Instead of guaranteeing frequency, it
guarantees a delay **between** worker calls:

```typescript
import { createDelayedWorkerTicker } from "@marianmeres/ticker";

// Execute async work, then pause for 5 seconds, then repeat...
const ticker = createDelayedWorkerTicker(
	async () => {
		const response = await fetch("/api/data");
		return response.json();
	},
	5000,
);

ticker.subscribe(({ started, finished, error, result }) => {
	if (started && !finished) {
		// Worker is in progress
		console.log("Fetching...");
	} else if (started && finished && !error) {
		// Worker completed successfully
		console.log("Got data:", result);
	} else if (error) {
		// Worker threw an error
		console.error("Fetch failed:", error);
	} else {
		// Ticker is stopped (or has not started yet)
	}
});

ticker.start();
```

## Dynamic Intervals

The interval can be a function that returns the number of milliseconds. This allows for
dynamic timing:

```typescript
// Exponential backoff example
let attempts = 0;
const ticker = createTicker((previousInterval) => {
	return Math.min(1000 * Math.pow(2, attempts++), 30000);
});
```

The function receives the previous interval value and the current store value as
arguments:

```typescript
type Interval = number | ((previous: number, storeVal: any) => number);
```

## Chaining API

All control methods return the ticker instance for chaining:

```typescript
const unsub = createTicker(1000)
	.setInterval(500)
	.start()
	.subscribe((v) => console.log(v));

// Later
ticker.stop();
unsub();
```

## Error Handling

Subscriber errors are caught and logged to prevent breaking the ticker. The ticker will
continue running even if a subscriber throws:

```typescript
ticker.subscribe((v) => {
	if (v && someCondition) {
		throw new Error("Oops!"); // Won't break the ticker
	}
});
```

You can provide a custom error handler using the options object signature:

```typescript
const ticker = createTicker(1000, {
	onError: (error) => {
		// Custom error handling (or silence errors)
		myLogger.warn("Subscriber error:", error);
	},
});
```

---

## API Reference

### `createTicker(interval?, startOrOptions?, logger?): Ticker`

Creates a ticker that emits timestamps at regular intervals.

Supports two signatures for backwards compatibility:

```typescript
// Legacy signature
createTicker(interval, start, logger);

// Options object signature
createTicker(interval, { start, logger, onError });
```

**Parameters:**

| Parameter        | Type                       | Default | Description                                      |
| ---------------- | -------------------------- | ------- | ------------------------------------------------ |
| `interval`       | `Interval`                 | `1000`  | Interval in ms, or function returning the ms.    |
| `startOrOptions` | `boolean \| TickerOptions` | `false` | Whether to start immediately, or options object. |
| `logger`         | `function`                 | `null`  | Optional debug logger (legacy signature only).   |

**Returns:** `Ticker`

---

### `createTickerRAF(interval?, startOrOptions?, logger?): Ticker`

Creates a ticker using `requestAnimationFrame` for timing. Same parameters as
`createTicker`.

---

### `createDelayedWorkerTicker(worker, interval?, startOrOptions?): DelayedWorkerTicker`

Creates a ticker for async workers that waits for work to complete before scheduling the
next tick.

Supports two signatures for backwards compatibility:

```typescript
// Legacy signature
createDelayedWorkerTicker(worker, interval, start);

// Options object signature
createDelayedWorkerTicker(worker, interval, { start, onError });
```

**Parameters:**

| Parameter        | Type                                           | Default | Description                                      |
| ---------------- | ---------------------------------------------- | ------- | ------------------------------------------------ |
| `worker`         | `(previous: DelayedTickerVal) => Promise<any>` | —       | Async function to execute on each tick.          |
| `interval`       | `Interval`                                     | `1000`  | Delay in ms after worker completes.              |
| `startOrOptions` | `boolean \| DelayedWorkerTickerOptions`        | `false` | Whether to start immediately, or options object. |

**Returns:** `DelayedWorkerTicker`

---

### `Ticker` Interface

```typescript
interface Ticker {
	/** Subscribe to tick events. Returns an unsubscribe function. */
	subscribe(cb: (timestamp: number) => void): () => void;

	/** Start the ticker. Returns the ticker for chaining. */
	start(): Ticker;

	/** Stop the ticker and reset state. Returns the ticker for chaining. */
	stop(): Ticker;

	/** Toggle between started and stopped. Returns the ticker for chaining. */
	toggle(): Ticker;

	/** Check if the ticker is currently running. */
	isStarted(): boolean;

	/** Change the interval dynamically. Returns the ticker for chaining. */
	setInterval(msOrFn: Interval): Ticker;

	/** Get the current interval value in milliseconds. */
	getInterval(): number;
}
```

---

### `DelayedWorkerTicker` Interface

```typescript
interface DelayedWorkerTicker {
	/** Subscribe to worker state changes. Returns an unsubscribe function. */
	subscribe(cb: (value: DelayedTickerVal) => void): () => void;

	/** Start the worker ticker. Returns the ticker for chaining. */
	start(): DelayedWorkerTicker;

	/** Stop the worker ticker. Returns the ticker for chaining. */
	stop(): DelayedWorkerTicker;

	/** Toggle between started and stopped. Returns the ticker for chaining. */
	toggle(): DelayedWorkerTicker;

	/** Check if the ticker is currently running. */
	isStarted(): boolean;

	/** Change the interval dynamically. Returns the ticker for chaining. */
	setInterval(ms: Interval): DelayedWorkerTicker;

	/** Get the current interval value in milliseconds. */
	getInterval(): number;
}
```

---

### `DelayedTickerVal` Interface

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

---

### `Interval` Type

```typescript
type Interval = number | ((previous: number, storeVal: any) => number);
```

---

### `ErrorHandler` Type

```typescript
type ErrorHandler = (error: unknown) => void;
```

---

### `TickerOptions` Interface

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

### `DelayedWorkerTickerOptions` Interface

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

### Helper Functions

These are also exported but primarily for internal use:

#### `isBrowser(): boolean`

Detects if running in a browser environment.

#### `getRaf(): { requestAnimationFrame, cancelAnimationFrame }`

Returns RAF functions (native in browser, polyfill elsewhere).

#### `setTimeoutRAF(cb, delay): () => void`

A `setTimeout`-like function using `requestAnimationFrame`. Returns a cancel function.

## Package Identity

- **Name:** @marianmeres/ticker
- **Author:** Marian Meres
- **Repository:** https://github.com/marianmeres/ticker
- **License:** MIT
