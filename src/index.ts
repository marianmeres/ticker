import { createStore } from '@marianmeres/store';

export const createTicker = (interval = 1000) => {
	interval = parseInt(interval as any, 10);
	if (isNaN(interval) || interval < 0) {
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

	return ticker;
};
