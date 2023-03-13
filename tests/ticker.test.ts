import path from 'node:path';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { createClog } from '@marianmeres/clog';
import { TestRunner } from '@marianmeres/test-runner';
import { createTicker } from '../src/index.js';

const clog = createClog(path.basename(fileURLToPath(import.meta.url)));
const suite = new TestRunner(path.basename(fileURLToPath(import.meta.url)));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

suite.test('tick tick', async () => {
	const t = createTicker(10);
	const log = [];

	const unsub = t.subscribe((v) => {
		log.push(v);
	});

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

	const unsub = t.subscribe((v) => {
		log.push(v);
	});

	t.start();
	await sleep(15);
	unsub();

	// 0, ts, ts, 0
	assert(log.length === 4);

	// starting again must have no effect, since we're unsubscribed
	t.start();
	assert(log.length === 4);

	// cleanup
	t.stop();
});

suite.test('tick sleep stop start', async () => {
	const t = createTicker(10);
	const log = [];

	const unsub = t.subscribe((v) => {
		log.push(v);
	});

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

export default suite;
