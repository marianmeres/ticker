import { createClog } from '@marianmeres/clog';
import { TestRunner } from '@marianmeres/test-runner';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTicker, createTickerRAF } from '../src/index.js';

const clog = createClog(path.basename(fileURLToPath(import.meta.url)));
const suite = new TestRunner(path.basename(fileURLToPath(import.meta.url)));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

suite.test('tick tick', async () => {
	const t = createTicker(10);
	const log: number[] = [];

	const unsub = t.subscribe((v) => log.push(v));

	// subscribe must have added zero (inactive timer)
	assert(log.length === 1);
	assert(log[0] === 0);

	// start ticks immediately
	t.start();

	// @ts-ignore WTF?
	assert(log.length === 2);

	// stop resets ticker state back to zero (it must log zero)
	t.stop();

	assert(log.length === 3);

	// cleanup
	unsub();

	assert(t.getInterval() === 10);
});

suite.test('tick sleep unsub', async () => {
	const t = createTicker(() => 10);
	const log: number[] = [];

	const unsub = t.subscribe((v) => log.push(v));

	t.start();

	await sleep(15);
	unsub();

	// 0, ts, ts
	assert(log.length === 3);

	// starting again must have no effect, since we're unsubscribed
	t.start();
	assert(log.length === 3);

	// cleanup
	t.stop();
});

suite.test('raf ticker', async () => {
	const t = createTickerRAF(1000 / 60);
	const log: number[] = [];

	const unsub = t.subscribe((v) => log.push(v));

	t.start();

	// 0, and only first
	await sleep(1000 / 60 + 5);
	// await sleep(10);
	t.stop();
	unsub();

	// 0 (factory), num (start tick), num (second tick), 0 (stop)
	assert(log.length === 4);
});

suite.test('tick sleep stop start', async () => {
	const t = createTicker(10);
	const log: number[] = [];

	const unsub = t.subscribe((v) => log.push(v));

	t.start();
	await sleep(15);
	t.stop();

	// 0, ts, ts, 0
	assert(log.length === 4);

	// starting again must have effect
	t.start();

	// @ts-ignore
	assert(log.length === 5);

	// cleanup
	unsub();
});

suite.test('multiple subs', async () => {
	const t = createTicker(10);
	const log1: number[] = [];
	const log2: number[] = [];

	const unsub1 = t.subscribe((v) => log1.push(v));
	const unsub2 = t.subscribe((v) => log2.push(v));

	t.start();
	await sleep(19);
	unsub1();

	await sleep(19);
	unsub2();

	// 0, ts, ts
	assert(log1.length === 3);

	// 0, ts, ts, ts, ts
	assert(log2.length === 5);

	// cleanup
	t.stop();
});

suite.test('chain api', async () => {
	const t = createTicker(10);
	const log: number[] = [];
	t.start().subscribe((v) => log.push(v))();
	assert(log.length === 1);
	t.stop();
});

suite.test('test from subscribe', async () => {
	const _log: any[] = [];
	const t = createTicker(5, false, (v: any) => _log.push(v));
	let i = 0;

	t.subscribe((v) => {
		if (!v) return;
		if (i++ === 3) t.stop();
		// clog(i);
	});

	t.start();
	await sleep(100);
	t.stop();

	assert(i === 4);
	assert(_log.length === 3);
});

export default suite;
