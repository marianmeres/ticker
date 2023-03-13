import { createStore } from '@marianmeres/store';

interface Ticker {
	subscribe: (cb: (timestamp: number) => void) => Function;
	start: () => Ticker;
	stop: () => Ticker;
}

export const createTicker = (interval = 1000, start = false): Ticker => {
	interval = parseInt(interval as any, 10);
	if (isNaN(interval) || interval <= 0) {
		throw new TypeError(
			`Invalid interval. Expecting positive non-zero number of milliseconds.`
		);
	}

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
		}
	};

	// start now?
	if (start) ticker.start();

	return ticker;
};
