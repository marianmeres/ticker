import path from 'node:path';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { createClog } from '@marianmeres/clog';
import { TestRunner } from '@marianmeres/test-runner';
import { createTicker } from '../src/index.js';
import { log } from 'util';

const clog = createClog(path.basename(fileURLToPath(import.meta.url)));
const suite = new TestRunner(path.basename(fileURLToPath(import.meta.url)));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

suite.test('tick tick', async () => {
	const t = createTicker(10);
	const log = [];

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
});

suite.test('tick sleep unsub', async () => {
	const t = createTicker(10);
	const log = [];

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

suite.test('tick sleep stop start', async () => {
	const t = createTicker(10);
	const log = [];

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

	// clenaup
	unsub();
});

suite.test('multiple subs', async () => {
	const t = createTicker(10);
	const log1 = [];
	const log2 = [];

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
	const log = [];
	t.start().subscribe((v) => log.push(v))();
	assert(log.length === 1);
	t.stop();
});

export default suite;
