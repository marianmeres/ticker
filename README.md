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

See [API.md](./API.md) for full API documentation.

### Factory Functions

| Function                    | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `createTicker`              | Fixed-frequency timer with drift correction        |
| `createTickerRAF`           | RAF-synchronized timer for animations              |
| `createDelayedWorkerTicker` | Timer for async work with delay between executions |

### Ticker Methods

All ticker instances provide: `subscribe()`, `start()`, `stop()`, `toggle()`,
`isStarted()`, `setInterval()`, `getInterval()`.

### Helper Exports

`isBrowser()`, `getRaf()`, `setTimeoutRAF()` — primarily for internal use.

## Package Identity

- **Name:** @marianmeres/ticker
- **Author:** Marian Meres
- **Repository:** https://github.com/marianmeres/ticker
- **License:** MIT
