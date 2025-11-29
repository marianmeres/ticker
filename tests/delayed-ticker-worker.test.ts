import { assert, assertEquals } from "@std/assert";
import { createDelayedWorkerTicker } from "../src/create-ticker.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.test("delayed ticker", async () => {
	let i = 0;
	const t = createDelayedWorkerTicker(
		(_previousVal: unknown) => {
			if (++i === 2) throw new Error("Boo");
			return i;
		},
		10,
		false,
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

	assertEquals(log.length, 7);
	assertEquals(finished.length, 3);

	assert(finished[1].error);

	assertEquals(t.getInterval(), 10);
});

Deno.test("delayed ticker restart", async () => {
	let i = 0;
	const t = createDelayedWorkerTicker(
		(_previousVal: unknown) => ++i,
		() => 10,
		false,
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

	assertEquals(log.length, 9);
	assertEquals(finished.length, 4);

	// clog(finished.filter((v) => v.result === 1));
	assertEquals(finished.filter((v) => v.result === 1).length, 2);
	assertEquals(finished.filter((v) => v.result === 2).length, 2);
});
