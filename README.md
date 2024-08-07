# @marianmeres/ticker

Do something when it ticks. With a [store compatible](https://github.com/marianmeres/store) API.

Under the hood it uses recursive `setTimeout` with interval corrections,
so it should guarantee the precise frequency **except** for the edge cases where the
**synchronous**
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
		// ticker is stopped (or has not started yet)
	}
});
```

## Delayed Worker Ticker

Using a tick signal from a sync ticker shown above for a periodical **asynchronous** work
(e.g. periodical api data fetching) [may not be the best choice](https://developer.mozilla.org/en-US/docs/Web/API/setInterval#ensure_that_execution_duration_is_shorter_than_interval_frequency).
For such cases, use its "delayed" sibling. Instead of frequency, it guarantees a delay
between worker calls.

## Delayed Worker Ticker Usage

```typescript
import { createDelayedWorkerTicker } from '@marianmeres/ticker';

// once started, it will do the work, then pause for 1 second, then repeat...
// (worker: CallableFunction, interval = 1000, start = false): DelayedWorkerTicker
const t = createDelayedWorkerTicker(async () => fetch('/api'), 1_000);

// control api
t.start();
t.stop();
t.setInterval(ms);

// subscribe api
const unsub = t.subscribe(({ started, finished, error, result }) => {
	// both `started` and `finished` are timestamps (or zero)
	if (started && !finished) {
		// worker's work is in progress
	} else if (started && finished) {
		// do something with `result` or `error`
	} else {
		// ticker is stopped (or has not started yet)
	}
});
```

## Interval value as a function

If desired, you can define the interval value as a function which returns the number of ms.

```typescript
type Interval = number | ((previous: number) => number);
```
