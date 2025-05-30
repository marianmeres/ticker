import { createStore } from '@marianmeres/store';
import { setTimeoutRAF } from './set-timeout-raf.js';

type Interval = number | ((previous: number, storeVal: any) => number);

interface Ticker {
	subscribe: (cb: (timestamp: number) => void) => CallableFunction;
	start: () => Ticker;
	stop: () => Ticker;
	setInterval: (msOrFn: Interval) => Ticker;
	getInterval: () => number;
}

const now = () => (typeof window !== 'undefined' ? window.performance.now() : Date.now());

const _assertValidInterval = (ms: number) => {
	ms = parseInt(ms as any, 10);
	if (Number.isNaN(ms) || ms <= 0) {
		throw new TypeError(
			`Invalid interval. Expecting positive non-zero number of milliseconds.`
		);
	}
	return ms;
};

/** Internal worker */
function _createTicker(
	interval: Interval = 1000,
	start = false,
	logger: any = null,
	useRaf = false
): Ticker {
	// for debug
	const _log = (...v) => (typeof logger === 'function' ? logger.apply(null, v) : null);

	// sanity check
	if (useRaf && typeof interval === 'number' && interval < 1000 / 60) {
		console.warn(
			[
				'Smaller interval than 60Hz may not be accurate with RAF ticker.',
				'Consider using `createTicker` instead of `createTickerRAF`.',
			].join(' ')
		);
	}
	const MIN_TIMEOUT = useRaf ? 1000 / 60 : 0;
	const _setTimeout = useRaf ? setTimeoutRAF : setTimeout;

	// initialize
	const _store = createStore<number>(0);
	let _timerId: any = 0;

	//
	const _getInterval = (previous: number) =>
		_assertValidInterval(
			typeof interval === 'function' ? interval(previous, _store.get()) : interval
		);
	let _previousInterval = _getInterval(0);

	// special case flag to be able to stop from inside
	let _isStarted = start;

	//
	let _last = 0;
	const _tick = () => {
		const _start = now();

		// maybe initialize
		_last ||= _start;

		// publish the tick (which is a sync call, which may trigger loads of work)
		// (always tick Date.now value, not performance.now, since it's page load relative)
		_store.set(Date.now());

		// we might have stopped from inside the subscriber, so return early
		if (!_isStarted) return;

		// which could have taken some time, so calculate the offset
		const _duration = now() - _last;
		const _offset = _duration ? _duration - _previousInterval : 0;

		// schedule next tick while applying the offset
		const _nextInterval = Math.max(
			MIN_TIMEOUT,
			_getInterval(_previousInterval) - _offset
		);
		_timerId = _setTimeout(_tick, _nextInterval);
		_previousInterval = _nextInterval;

		//
		_last = now();

		// debug
		_log({ _start, _duration, _offset, _nextInterval });

		// the basic approach:
		// _store.set(Date.now());
		// _timerId = setTimeout(_tick, interval);
	};

	const ticker = {
		subscribe: _store.subscribe,
		start: () => {
			_isStarted = true;
			!_timerId && _tick();
			return ticker;
		},
		stop: () => {
			_isStarted = false;
			_store.set(0);
			if (_timerId) {
				// for RAF
				if (typeof _timerId === 'function') {
					_timerId();
				}
				// for regular setTimeout
				else {
					clearTimeout(_timerId);
				}
				_timerId = 0;
			}
			_last = 0;
			_previousInterval = 0;
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
		// readonly initial interval value
		getInterval: () => _getInterval(0),
	};

	// start now?
	if (start) ticker.start();

	return ticker;
}

/** Main API */
export function createTicker(
	interval: Interval = 1000,
	start = false,
	logger: any = null
): Ticker {
	return _createTicker(interval, start, logger, false);
}

/** Main API */
export const createTickerRAF = (
	interval: Interval = 1000,
	start = false,
	logger: any = null
): Ticker => {
	return _createTicker(interval, start, logger, true);
};

//
interface DelayedTickerVal {
	started: number;
	finished: number;
	error: any;
	result: any;
}

interface DelayedWorkerTicker {
	subscribe: (cb: (previous: DelayedTickerVal) => void) => CallableFunction;
	start: () => DelayedWorkerTicker;
	stop: () => DelayedWorkerTicker;
	setInterval: (ms: Interval) => DelayedWorkerTicker;
	getInterval: () => number;
}

/** Main API */
export const createDelayedWorkerTicker = (
	worker: CallableFunction,
	interval: Interval = 1000,
	start = false
): DelayedWorkerTicker => {
	// prettier-ignore
	const _createVal = (o: Partial<DelayedTickerVal> = {}): DelayedTickerVal => ({
		started: 0, finished: 0, error: null, result: null, ...(o || {}),
	});

	// initialize
	let _previousInterval = 0;
	const _store = createStore<DelayedTickerVal>(_createVal());

	const _getInterval = (previous: number) =>
		_assertValidInterval(
			typeof interval === 'function' ? interval(previous, _store.get()) : interval
		);

	//
	let _timerId: any = 0;
	let _isStarted: boolean = start;

	//
	const _tick = async () => {
		if (!_isStarted) return;
		const started = Date.now();
		try {
			const previous = _store.get();
			_store.set(_createVal({ started }));
			const result = await worker(previous);
			// update only if has not been stopped in the meantime...
			_isStarted &&
				_store.set(_createVal({ started, finished: Date.now(), error: null, result }));
		} catch (error) {
			_isStarted && _store.set(_createVal({ started, finished: Date.now(), error }));
		}

		//
		if (_isStarted) {
			_timerId && clearTimeout(_timerId);
			// no need to adjust interval here
			const _nextInterval = _getInterval(_previousInterval || 0);
			_timerId = setTimeout(_tick, _nextInterval);
			_previousInterval = _nextInterval;
		}
	};

	const ticker = {
		subscribe: _store.subscribe,
		start: () => {
			_isStarted = true;
			!_timerId && _tick();
			return ticker;
		},
		stop: () => {
			if (_timerId) {
				clearTimeout(_timerId);
				_timerId = 0;
			}
			_isStarted = false;
			_previousInterval = 0;
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
		// readonly initial interval value
		getInterval: () => _getInterval(0),
	};

	// start now?
	if (start) ticker.start();

	return ticker;
};
