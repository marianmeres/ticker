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
		if (Number.isNaN(ms) || ms <= 0) {
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
