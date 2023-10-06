import { createClog } from '@marianmeres/clog';
import { TestRunner } from '@marianmeres/test-runner';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRecursiveTicker, createTicker } from '../src/index.js';

const clog = createClog(path.basename(fileURLToPath(import.meta.url)));
const suite = new TestRunner(path.basename(fileURLToPath(import.meta.url)));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

suite.test('recursive tick', async () => {
	let i = 0;
	const t = createRecursiveTicker(
		async (previousVal) => {
			if (++i === 2) {
				throw new Error('Boo');
			}
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

export default suite;
