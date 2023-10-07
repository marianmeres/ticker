import { createStore } from '@marianmeres/store';

interface Ticker {
	subscribe: (cb: (timestamp: number) => void) => CallableFunction;
	start: () => Ticker;
	stop: () => Ticker;
	setInterval: (ms: number) => Ticker;
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

export const createTicker = (interval = 1000, start = false, logger = null): Ticker => {
	// for debug
	const _log = (...v) => (typeof logger === 'function' ? logger.apply(null, v) : null);

	const _setInterval = (ms) => (interval = _assertValidInterval(ms));

	// initialize
	_setInterval(interval);
	const _store = createStore<number>(0);
	let _timerId: any = 0;

	//
	let _last = 0;
	const _tick = () => {
		const _start = now();

		// maybe initialize
		_last ||= _start;

		// publish the tick (which is a sync call, which may trigger loads of work)
		// (always tick Date.now value, not performance.now, since it's page load relative)
		_store.set(Date.now());

		// which could have taken some time, so calculate the offset
		const _duration = now() - _last;
		const _offset = _duration ? _duration - interval : 0;

		// schedule next tick while applying the offset
		const _nextInterval = Math.max(0, interval - _offset);
		_timerId = setTimeout(_tick, _nextInterval);

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
			!_timerId && _tick();
			return ticker;
		},
		stop: () => {
			_store.set(0);
			if (_timerId) {
				clearTimeout(_timerId);
				_timerId = 0;
			}
			_last = 0;
			return ticker;
		},
		setInterval: (ms: number) => {
			_setInterval(ms);
			return ticker;
		},
	};

	// start now?
	if (start) ticker.start();

	return ticker;
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
	setInterval: (ms: number) => DelayedWorkerTicker;
}

//
export const createDelayedWorkerTicker = (
	worker: CallableFunction,
	interval = 1000,
	start = false
): DelayedWorkerTicker => {
	const _setInterval = (ms) => (interval = _assertValidInterval(ms));

	// prettier-ignore
	const _createVal = (o: Partial<DelayedTickerVal> = {}): DelayedTickerVal => ({
		started: 0, finished: 0, error: null, result: null, ...(o || {}),
	});

	// initialize
	_setInterval(interval);
	const _store = createStore<DelayedTickerVal>(_createVal());

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
			_isStarted && _store.set(_createVal({ started, finished: Date.now(), result }));
		} catch (error) {
			_isStarted && _store.set(_createVal({ started, finished: Date.now(), error }));
		}

		//
		if (_isStarted) {
			_timerId && clearTimeout(_timerId);
			// no need to adjust interval here
			_timerId = setTimeout(_tick, interval);
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
			return ticker;
		},
		setInterval: (ms: number) => {
			_setInterval(ms);
			return ticker;
		},
	};

	// start now?
	if (start) ticker.start();

	return ticker;
};
