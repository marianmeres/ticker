import { createStore } from '@marianmeres/store';

const now = () => (typeof window !== 'undefined' ? window.performance.now() : Date.now());

export const createTicker = (interval = 1000) => {
	const _store = createStore(0);
	let _timerId: any = 0;

	interval = parseInt(interval as any, 10);
	if (isNaN(interval) || interval < 0) {
		throw new Error(
			`Invalid interval. Expecting positive non-zero number of milliseconds.`
		);
	}

	const _tick = () => {
		_store.set(now());
		_timerId = setTimeout(_tick, interval);
	};

	const start = () => !_timerId && _tick();

	const stop = () => {
		_store.set(0);
		if (_timerId) {
			clearTimeout(_timerId);
			_timerId = 0;
		}
	};

	return {
		start,
		stop,
		subscribe: (cb: Function) => {
			const unsub = _store.subscribe(cb);
			return () => {
				stop();
				unsub();
			};
		},
	};
};
