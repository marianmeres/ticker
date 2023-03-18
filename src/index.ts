import { createStore } from '@marianmeres/store';

interface Ticker {
	subscribe: (cb: (timestamp: number) => void) => Function;
	start: () => Ticker;
	stop: () => Ticker;
	setInterval: (ms: number) => Ticker;
}

const now = () => (typeof window !== 'undefined' ? window.performance.now() : Date.now());

export const createTicker = (interval = 1000, start = false, logger = null): Ticker => {
	// for debug
	const _log = (...v) => (typeof logger === 'function' ? logger.apply(null, v) : null);

	const _setInterval = (ms) => {
		ms = parseInt(ms as any, 10);
		if (isNaN(ms) || ms <= 0) {
			throw new TypeError(
				`Invalid interval. Expecting positive non-zero number of milliseconds.`
			);
		}
		interval = ms;
	};

	// initialize
	_setInterval(interval);
	const _store = createStore(0);
	let _timerId: any = 0;

	//
	let _lastTick = 0;
	const _tick = () => {
		const _start = now();

		// initialize to now, if starting
		_lastTick ||= _start;

		// publish the tick... which is a sync call, which may trigger loads of work...
		_store.set(_start);

		// so it could have lasted some significant time...
		const _duration = _start - _lastTick;
		const _offset = _duration ? _duration - interval : 0;

		// so plan the next call schedule with potential correction
		const _nextInterval = Math.max(0, interval - _offset);
		_timerId = setTimeout(_tick, _nextInterval);
		_log({ _start, _duration, _offset, _nextInterval });

		// finally, save this tick's now for the next call...
		_lastTick = now();

		// the initial "keep it simple and stupid" implementation:
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
			_lastTick = 0;
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
