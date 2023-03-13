import { createStore } from '@marianmeres/store';

interface Ticker {
	subscribe: (cb: (timestamp: number) => void) => Function;
	start: () => Ticker;
	stop: () => Ticker;
	setInterval: (ms: number) => Ticker;
}

export const createTicker = (interval = 1000, start = false): Ticker => {
	const _setInterval = (ms) => {
		ms = parseInt(ms as any, 10);
		if (isNaN(ms) || ms <= 0) {
			throw new TypeError(
				`Invalid interval. Expecting positive non-zero number of milliseconds.`
			);
		}
		interval = ms;
	}

	// initialize
	_setInterval(interval);
	const _store = createStore(0);
	let _timerId: any = 0;

	const _tick = () => {
		_store.set(Date.now());
		_timerId = setTimeout(_tick, interval);
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
			return ticker;
		},
		setInterval: (ms: number) => {
			_setInterval(ms);
			return ticker;
		}
	};

	// start now?
	if (start) ticker.start();

	return ticker;
};
