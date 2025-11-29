import { createStore } from "@marianmeres/store";
import { setTimeoutRAF } from "./set-timeout-raf.ts";

/**
 * Interval can be a static number of milliseconds or a function that returns
 * the number of milliseconds. The function receives the previous interval value
 * and the current store value as arguments.
 */
export type Interval = number | ((previous: number, storeVal: any) => number);

/**
 * Error handler function type.
 */
export type ErrorHandler = (error: unknown) => void;

/**
 * Options for createTicker and createTickerRAF.
 */
export interface TickerOptions {
	/** Whether to start the ticker immediately. Defaults to false. */
	start?: boolean;
	/** Optional debug logger function. */
	logger?: ((...args: unknown[]) => void) | null;
	/** Optional error handler for subscriber errors. If not provided, errors are logged to console. */
	onError?: ErrorHandler | null;
}

/**
 * Ticker instance returned by `createTicker` and `createTickerRAF`.
 * Provides a store-compatible subscription API for reactive timing.
 */
export interface Ticker {
	/**
	 * Subscribe to tick events. The callback receives the current timestamp
	 * (Date.now()) on each tick, or 0 when the ticker is stopped.
	 * Returns an unsubscribe function.
	 */
	subscribe: (cb: (timestamp: number) => void) => () => void;
	/**
	 * Start the ticker. Returns the ticker instance for chaining.
	 */
	start: () => Ticker;
	/**
	 * Stop the ticker and reset state. Returns the ticker instance for chaining.
	 */
	stop: () => Ticker;
	/**
	 * Toggle between started and stopped states. Returns the ticker instance for chaining.
	 */
	toggle: () => Ticker;
	/**
	 * Check if the ticker is currently running.
	 */
	isStarted: () => boolean;
	/**
	 * Change the interval dynamically. Accepts a number or a function.
	 * Returns the ticker instance for chaining.
	 */
	setInterval: (msOrFn: Interval) => Ticker;
	/**
	 * Get the current interval value in milliseconds.
	 */
	getInterval: () => number;
}

/**
 * Validates that the interval is a positive non-zero integer.
 * @throws {TypeError} If the interval is invalid.
 */
const _assertValidInterval = (ms: number): number => {
	ms = parseInt(ms as any, 10);
	if (Number.isNaN(ms) || ms <= 0) {
		throw new TypeError(
			`Invalid interval. Expecting positive non-zero number of milliseconds.`
		);
	}
	return ms;
};

/** Internal ticker factory */
function _createTicker(
	interval: Interval = 1000,
	start = false,
	logger: ((...args: unknown[]) => void) | null = null,
	useRaf = false,
	onError: ErrorHandler | null = null
): Ticker {
	// for debug
	const _log = (...v: unknown[]) =>
		typeof logger === "function" ? logger.apply(null, v) : null;

	// sanity check
	if (useRaf && typeof interval === "number" && interval < 1000 / 60) {
		console.warn(
			[
				"Smaller interval than 60Hz may not be accurate with RAF ticker.",
				"Consider using `createTicker` instead of `createTickerRAF`.",
			].join(" ")
		);
	}
	const MIN_TIMEOUT = useRaf ? 1000 / 60 : 0;
	const _setTimeout = useRaf ? setTimeoutRAF : setTimeout;

	// initialize - pass onError to underlying store if provided
	const _store = createStore<number>(0, onError ? { onError } : undefined);
	let _timerId: any = 0;

	const _getInterval = (previous: number) =>
		_assertValidInterval(
			typeof interval === "function"
				? interval(previous, _store.get())
				: interval
		);

	// track the adjusted interval
	let _previousInterval = _getInterval(0);

	// special case flag to be able to stop from inside
	let _isStarted = start;

	let _last = 0;

	const _tick = () => {
		const _start = Date.now();

		// maybe initialize
		_last ||= _start;

		// publish the tick (which is a sync call, which may trigger loads of work)
		// note: subscriber errors are caught by the underlying store/pubsub
		_store.set(Date.now());

		// we might have stopped from inside the subscriber, so return early
		if (!_isStarted) return;

		// which could have taken some time, so calculate the offset
		const _duration = Date.now() - _last;
		const _offset = _duration ? _duration - _previousInterval : 0;

		// schedule next tick while applying the offset
		const _nextInterval = Math.max(
			MIN_TIMEOUT,
			_getInterval(_previousInterval) - _offset
		);
		_timerId = _setTimeout(_tick, _nextInterval);
		_previousInterval = _nextInterval;

		_last = Date.now();

		// debug
		_log({ _start, _duration, _offset, _nextInterval });
	};

	const ticker: Ticker = {
		subscribe: _store.subscribe,
		start: () => {
			_isStarted = true;
			// reinitialize _previousInterval on start to fix the restart bug
			_previousInterval = _getInterval(0);
			!_timerId && _tick();
			return ticker;
		},
		stop: () => {
			_isStarted = false;
			_store.set(0);
			if (_timerId) {
				// for RAF
				if (typeof _timerId === "function") {
					_timerId();
				} // for regular setTimeout
				else {
					clearTimeout(_timerId);
				}
				_timerId = 0;
			}
			_last = 0;
			return ticker;
		},
		toggle: () => {
			_isStarted ? ticker.stop() : ticker.start();
			return ticker;
		},
		isStarted: () => _isStarted,
		setInterval: (msOrFn: Interval) => {
			interval = msOrFn;
			return ticker;
		},
		getInterval: () => _getInterval(0),
	};

	// start now?
	if (start) ticker.start();

	return ticker;
}

/**
 * Creates a ticker that emits timestamps at regular intervals.
 *
 * The ticker uses recursive `setTimeout` with drift correction to maintain
 * accurate timing. Subscribers receive `Date.now()` on each tick, or `0`
 * when stopped.
 *
 * @param interval - Interval in milliseconds, or a function returning the interval.
 *                   Defaults to 1000ms.
 * @param startOrOptions - Whether to start immediately (boolean), or options object.
 * @param logger - Optional debug logger function (legacy signature only).
 * @returns A Ticker instance with start/stop/subscribe methods.
 *
 * @example
 * ```typescript
 * // Legacy signature
 * const ticker = createTicker(1000, true, console.log);
 *
 * // Options object signature
 * const ticker = createTicker(1000, { start: true, onError: () => {} });
 *
 * const unsub = ticker.subscribe((timestamp) => {
 *   if (timestamp) console.log('Tick at', timestamp);
 * });
 * ticker.start();
 * // later...
 * ticker.stop();
 * unsub();
 * ```
 */
export function createTicker(
	interval: Interval = 1000,
	startOrOptions: boolean | TickerOptions = false,
	logger: ((...args: unknown[]) => void) | null = null
): Ticker {
	// Support both legacy (boolean, logger) and new (options object) signatures
	if (typeof startOrOptions === "object" && startOrOptions !== null) {
		const opts = startOrOptions;
		return _createTicker(
			interval,
			opts.start ?? false,
			opts.logger ?? null,
			false,
			opts.onError ?? null
		);
	}
	return _createTicker(
		interval,
		startOrOptions as boolean,
		logger,
		false,
		null
	);
}

/**
 * Creates a ticker that uses `requestAnimationFrame` for timing.
 *
 * This is useful for animations or visual updates that should sync with
 * the browser's repaint cycle. The minimum effective interval is ~16.67ms (60Hz).
 *
 * @param interval - Interval in milliseconds, or a function returning the interval.
 *                   Defaults to 1000ms. Values below 16.67ms will trigger a warning.
 * @param startOrOptions - Whether to start immediately (boolean), or options object.
 * @param logger - Optional debug logger function (legacy signature only).
 * @returns A Ticker instance with start/stop/subscribe methods.
 *
 * @example
 * ```typescript
 * // Legacy signature
 * const ticker = createTickerRAF(1000 / 60, true);
 *
 * // Options object signature
 * const ticker = createTickerRAF(1000 / 60, { onError: () => {} });
 *
 * ticker.subscribe((timestamp) => {
 *   if (timestamp) updateAnimation();
 * });
 * ticker.start();
 * ```
 */
export const createTickerRAF = (
	interval: Interval = 1000,
	startOrOptions: boolean | TickerOptions = false,
	logger: ((...args: unknown[]) => void) | null = null
): Ticker => {
	// Support both legacy (boolean, logger) and new (options object) signatures
	if (typeof startOrOptions === "object" && startOrOptions !== null) {
		const opts = startOrOptions;
		return _createTicker(
			interval,
			opts.start ?? false,
			opts.logger ?? null,
			true,
			opts.onError ?? null
		);
	}
	return _createTicker(interval, startOrOptions as boolean, logger, true, null);
};

/**
 * Options for createDelayedWorkerTicker.
 */
export interface DelayedWorkerTickerOptions {
	/** Whether to start the ticker immediately. Defaults to false. */
	start?: boolean;
	/** Optional error handler for subscriber errors. If not provided, errors are logged to console. */
	onError?: ErrorHandler | null;
}

/**
 * Value emitted by DelayedWorkerTicker on each tick.
 */
export interface DelayedTickerVal {
	/** Timestamp when the worker started (or 0 if not started) */
	started: number;
	/** Timestamp when the worker finished (or 0 if still running) */
	finished: number;
	/** Error thrown by the worker, if any */
	error: any;
	/** Result returned by the worker, if successful */
	result: any;
}

/**
 * Ticker instance for async workers, returned by `createDelayedWorkerTicker`.
 * Guarantees a delay between worker calls rather than a fixed frequency.
 */
export interface DelayedWorkerTicker {
	/**
	 * Subscribe to worker state changes. The callback receives an object with
	 * `started`, `finished`, `error`, and `result` properties.
	 * Returns an unsubscribe function.
	 */
	subscribe: (cb: (value: DelayedTickerVal) => void) => () => void;
	/**
	 * Start the worker ticker. Returns the ticker instance for chaining.
	 */
	start: () => DelayedWorkerTicker;
	/**
	 * Stop the worker ticker. Returns the ticker instance for chaining.
	 */
	stop: () => DelayedWorkerTicker;
	/**
	 * Toggle between started and stopped states. Returns the ticker instance for chaining.
	 */
	toggle: () => DelayedWorkerTicker;
	/**
	 * Check if the ticker is currently running.
	 */
	isStarted: () => boolean;
	/**
	 * Change the interval dynamically. Accepts a number or a function.
	 * Returns the ticker instance for chaining.
	 */
	setInterval: (ms: Interval) => DelayedWorkerTicker;
	/**
	 * Get the current interval value in milliseconds.
	 */
	getInterval: () => number;
}

/**
 * Creates a ticker for async workers that waits for the work to complete
 * before scheduling the next tick.
 *
 * Unlike `createTicker`, this guarantees a delay *between* worker calls,
 * not a fixed frequency. This is ideal for periodic async operations like
 * API polling where you want to avoid overlapping requests.
 *
 * @param worker - Async function to execute on each tick. Receives the previous
 *                 tick's value as an argument.
 * @param interval - Delay in milliseconds after worker completes before next call.
 *                   Can be a number or a function returning a number. Defaults to 1000ms.
 * @param startOrOptions - Whether to start immediately (boolean), or options object.
 * @returns A DelayedWorkerTicker instance.
 *
 * @example
 * ```typescript
 * // Legacy signature
 * const ticker = createDelayedWorkerTicker(fetchData, 5000, true);
 *
 * // Options object signature
 * const ticker = createDelayedWorkerTicker(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     return response.json();
 *   },
 *   5000,
 *   { onError: () => {} }
 * );
 *
 * ticker.subscribe(({ started, finished, error, result }) => {
 *   if (started && !finished) {
 *     console.log('Fetching...');
 *   } else if (finished && !error) {
 *     console.log('Got data:', result);
 *   } else if (error) {
 *     console.error('Fetch failed:', error);
 *   }
 * });
 *
 * ticker.start();
 * ```
 */
export const createDelayedWorkerTicker = (
	worker: (previous: DelayedTickerVal) => Promise<unknown> | unknown,
	interval: Interval = 1000,
	startOrOptions: boolean | DelayedWorkerTickerOptions = false
): DelayedWorkerTicker => {
	// Support both legacy (boolean) and new (options object) signatures
	const start =
		typeof startOrOptions === "object" && startOrOptions !== null
			? startOrOptions.start ?? false
			: (startOrOptions as boolean);
	const onError =
		typeof startOrOptions === "object" && startOrOptions !== null
			? startOrOptions.onError ?? null
			: null;

	const _createVal = (o: Partial<DelayedTickerVal> = {}): DelayedTickerVal => ({
		started: 0,
		finished: 0,
		error: null,
		result: null,
		...(o || {}),
	});

	// initialize - pass onError to underlying store if provided
	const _store = createStore<DelayedTickerVal>(
		_createVal(),
		onError ? { onError } : undefined
	);

	const _getInterval = (previous: number) =>
		_assertValidInterval(
			typeof interval === "function"
				? interval(previous, _store.get())
				: interval
		);

	let _timerId: any = 0;
	let _isStarted: boolean = start;
	let _previousInterval = 0;

	const _tick = async () => {
		if (!_isStarted) return;
		const started = Date.now();
		try {
			const previous = _store.get();
			_store.set(_createVal({ started }));
			const result = await worker(previous);
			// update only if has not been stopped in the meantime...
			_isStarted &&
				_store.set(
					_createVal({ started, finished: Date.now(), error: null, result })
				);
		} catch (error) {
			_isStarted &&
				_store.set(_createVal({ started, finished: Date.now(), error }));
		}

		if (_isStarted) {
			_timerId && clearTimeout(_timerId);
			const _nextInterval = _getInterval(_previousInterval || _getInterval(0));
			_timerId = setTimeout(_tick, _nextInterval);
			_previousInterval = _nextInterval;
		}
	};

	const ticker: DelayedWorkerTicker = {
		subscribe: _store.subscribe,
		start: () => {
			_isStarted = true;
			_previousInterval = _getInterval(0);
			!_timerId && _tick();
			return ticker;
		},
		stop: () => {
			if (_timerId) {
				clearTimeout(_timerId);
				_timerId = 0;
			}
			_isStarted = false;
			return ticker;
		},
		toggle: () => {
			_isStarted ? ticker.stop() : ticker.start();
			return ticker;
		},
		isStarted: () => _isStarted,
		setInterval: (msOrFn: Interval) => {
			interval = msOrFn;
			return ticker;
		},
		getInterval: () => _getInterval(0),
	};

	// start now?
	if (start) ticker.start();

	return ticker;
};
