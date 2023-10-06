# @marianmeres/ticker

Do something when it ticks. With a [store compatible](https://github.com/marianmeres/store) API.

Under the hood it uses recursive `setTimeout` with interval corrections,
so it should guarantee the precise frequency **except** for the edge cases where the synchronous
subscriber's work cannot keep up with the interval - it will never tick sooner before it
finishes.

## Install

```shell
$ npm i @marianmeres/ticker
```

## Usage

```typescript
import { createTicker } from '@marianmeres/ticker';

// once started, will tick every 1000 milliseconds
// (interval = 1000, start = false): Ticker
const t = createTicker(1_000);

// basic control api
t.start();
t.stop();

// decrease/increase frequency on existing instance
t.setInterval(ms);

// subscribe api
const unsub = t.subscribe((timestamp) => {
	if (timestamp) {
		// do something on tick
	} else {
		// ticker is stopped (or has not start yet)
	}
});
```

## Recursive Ticker

For periodical async work (e.g. periodical api data fetching) using a tick signal from a sync
ticker shown above [may not be the best option](https://developer.mozilla.org/en-US/docs/Web/API/setInterval#ensure_that_execution_duration_is_shorter_than_interval_frequency).
For such cases use it's "recursive" sibling. Instead of frequency it guarantees the delay
between the ticks.

## Recursive Ticker Usage

```typescript
import { createRecursiveTicker } from '@marianmeres/ticker';

// once started, will do the work, then pause 1 second, and repeat...
// (worker: CallableFunction, interval = 1000, start = false): RecursiveTicker
const t = createRecursiveTicker(async () => fetch('/api'), 1_000);

// control api works normally
t.start();
t.stop();
t.setInterval(ms);

// subscribe api
const unsub = t.subscribe(({ started, finished, error, result }) => {
	// both `started` and `finished` are timestamps or zero
	if (started && !finished) {
		// work is in progress
	} else if (started && finished) {
		// do something with `result` or `error`
	} else {
		// ticker is stopped (or has not start yet)
	}
});
```
