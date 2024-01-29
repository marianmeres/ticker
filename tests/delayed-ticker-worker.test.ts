import { createClog } from '@marianmeres/clog';
import { TestRunner } from '@marianmeres/test-runner';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDelayedWorkerTicker } from '../src/index.js';

const clog = createClog(path.basename(fileURLToPath(import.meta.url)));
const suite = new TestRunner(path.basename(fileURLToPath(import.meta.url)));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

suite.test('delayed ticker', async () => {
	let i = 0;
	const t = createDelayedWorkerTicker(
		async (previousVal) => {
			if (++i === 2) throw new Error('Boo');
			return i;
		},
		10,
		false
	);
	const log: any[] = [];

	const unsub = t.subscribe((v) => log.push(v));

	t.start();

	await sleep(29);
	t.stop();
	unsub();

	const finished = log.filter((v) => v.started && v.finished);

	// console.log(log);
	// console.log('finished', finished);

	assert(log.length === 7);
	assert(finished.length === 3);

	assert(finished[1].error);
});

suite.test('delayed ticker restart', async () => {
	let i = 0;
	const t = createDelayedWorkerTicker(
		async (previousVal) => ++i,
		() => 10,
		false
	);
	const log: any[] = [];

	const unsub = t.subscribe((v) => log.push(v));

	t.start();

	await sleep(14);

	// restart
	i = 0;
	t.stop().start();

	await sleep(14);

	t.stop();
	unsub();

	const finished = log.filter((v) => v.started && v.finished);

	// console.log(log);
	// console.log('finished', finished);

	assert(log.length === 9);
	assert(finished.length === 4);

	// clog(finished.filter((v) => v.result === 1));
	assert(finished.filter((v) => v.result === 1).length == 2);
	assert(finished.filter((v) => v.result === 2).length == 2);
});

export default suite;
