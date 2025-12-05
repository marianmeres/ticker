# AGENTS.md - Machine-Readable Package Documentation

## Package Identity

- **Name:** `@marianmeres/ticker`
- **Version:** 1.16.2
- **License:** MIT
- **Repository:** https://github.com/marianmeres/ticker
- **NPM:** https://www.npmjs.com/package/@marianmeres/ticker
- **JSR:** https://jsr.io/@marianmeres/ticker

## Purpose

A timing utility library that provides store-compatible reactive tickers for periodic
execution. Uses recursive `setTimeout` with drift correction for accurate timing.

## Core Concepts

### Ticker Types

1. **Regular Ticker (`createTicker`)**: Fixed-frequency timer using `setTimeout` with
   drift correction
2. **RAF Ticker (`createTickerRAF`)**: Timer synchronized with browser's
   `requestAnimationFrame` cycle
3. **Delayed Worker Ticker (`createDelayedWorkerTicker`)**: Timer for async work with
   guaranteed delay between executions

### Key Behaviors

- **Store-compatible API**: Uses `subscribe()` pattern from `@marianmeres/store`
- **Drift correction**: Automatically adjusts timing to maintain accurate intervals
- **Error resilience**: Subscriber errors are caught; ticker continues running
- **Chainable API**: All control methods return the ticker instance

## File Structure

```
src/
├── mod.ts                 # Entry point, re-exports all public API
├── create-ticker.ts       # Main ticker factory functions and types
├── get-raf.ts             # RAF abstraction with server polyfill
├── set-timeout-raf.ts     # setTimeout using RAF timing
└── is-browser.ts          # Browser environment detection
tests/
├── ticker.test.ts         # Basic ticker tests
├── delayed-ticker-worker.test.ts  # Delayed worker tests
└── edge-cases.test.ts     # Edge case coverage
```

## Public API

### Factory Functions

| Function                                                 | Returns               | Description                                     |
| -------------------------------------------------------- | --------------------- | ----------------------------------------------- |
| `createTicker(interval?, options?)`                      | `Ticker`              | Fixed-frequency timer with drift correction     |
| `createTickerRAF(interval?, options?)`                   | `Ticker`              | RAF-synchronized timer (browser-optimized)      |
| `createDelayedWorkerTicker(worker, interval?, options?)` | `DelayedWorkerTicker` | Timer for async work with post-completion delay |

### Types

```typescript
type Interval = number | ((previous: number, storeVal: any) => number);
type ErrorHandler = (error: unknown) => void;

interface TickerOptions {
	start?: boolean;
	logger?: ((...args: unknown[]) => void) | null;
	onError?: ErrorHandler | null;
}

interface Ticker {
	subscribe(cb: (timestamp: number) => void): () => void;
	start(): Ticker;
	stop(): Ticker;
	toggle(): Ticker;
	isStarted(): boolean;
	setInterval(msOrFn: Interval): Ticker;
	getInterval(): number;
}

interface DelayedTickerVal {
	started: number; // Timestamp or 0
	finished: number; // Timestamp or 0
	error: any; // Error or null
	result: any; // Return value or null
}

interface DelayedWorkerTicker {
	subscribe(cb: (value: DelayedTickerVal) => void): () => void;
	start(): DelayedWorkerTicker;
	stop(): DelayedWorkerTicker;
	toggle(): DelayedWorkerTicker;
	isStarted(): boolean;
	setInterval(ms: Interval): DelayedWorkerTicker;
	getInterval(): number;
}
```

### Helper Functions

| Function                   | Returns        | Description                                          |
| -------------------------- | -------------- | ---------------------------------------------------- |
| `isBrowser()`              | `boolean`      | Detects browser environment                          |
| `getRaf()`                 | `RafInterface` | Returns RAF functions (native or polyfill)           |
| `setTimeoutRAF(cb, delay)` | `() => void`   | setTimeout using RAF timing, returns cancel function |

## Dependencies

- **Runtime:** `@marianmeres/store` (JSR: `jsr:@marianmeres/store@^2.3.1`)
- **Dev/Test:** `@std/assert`, `@std/fs`, `@std/path`

## Platform Support

- **Deno:** Native support
- **Node.js:** Via npm package (built with dnt)
- **Browser:** Full support with native RAF
- **Server/SSR:** RAF polyfill using setTimeout at ~60Hz

## Implementation Details

### Drift Correction Algorithm

```
1. Record start timestamp before tick
2. Execute subscriber callbacks (synchronous)
3. Calculate execution duration
4. Compute offset = duration - expected_interval
5. Schedule next tick with adjusted interval: max(MIN_TIMEOUT, interval - offset)
```

### Timer Cleanup

- Regular ticker: `clearTimeout(timerId)`
- RAF ticker: Timer ID is a cancel function, called directly
- Both reset internal state on stop

### Error Handling

Errors are propagated to `onError` handler if provided, otherwise logged to
`console.error`. The ticker continues running after errors.

## Common Patterns

### Basic Timer

```typescript
const ticker = createTicker(1000);
const unsub = ticker.subscribe((ts) => ts && console.log("tick"));
ticker.start();
// cleanup: ticker.stop(); unsub();
```

### Polling with Retry

```typescript
const ticker = createDelayedWorkerTicker(
	async () => fetch("/api/status").then((r) => r.json()),
	5000,
	{ start: true },
);
ticker.subscribe(({ error, result }) => {
	if (error) console.error(error);
	else handleResult(result);
});
```

### Dynamic Interval (Exponential Backoff)

```typescript
let attempts = 0;
const ticker = createTicker((prev) => Math.min(1000 * 2 ** attempts++, 30000));
```

### Animation Loop

```typescript
const ticker = createTickerRAF(1000 / 60);
ticker.subscribe((ts) => ts && render());
ticker.start();
```

## Constraints

- Interval must be positive non-zero integer (throws `TypeError` otherwise)
- RAF ticker warns if interval < 16.67ms (60Hz limit)
- Subscriber work should be synchronous; for async work use `createDelayedWorkerTicker`
- Store value is `0` when stopped, timestamp (`Date.now()`) when running

## Testing

```bash
deno test           # Run all tests
deno test --watch   # Watch mode
```

## Building for NPM

```bash
deno task npm:build    # Build to .npm-dist/
deno task npm:publish  # Build and publish
```
