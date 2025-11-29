import { assertEquals } from "@std/assert";
import { createTicker, createTickerRAF } from "../src/create-ticker.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.test("tick tick", () => {
	const t = createTicker(10);
	const log: number[] = [];

	const unsub = t.subscribe((v) => log.push(v));

	// subscribe must have added zero (inactive timer)
	assertEquals(log.length, 1);
	assertEquals(log[0], 0);

	// start ticks immediately
	t.start();

	assertEquals(log.length, 2);

	// stop resets ticker state back to zero (it must log zero)
	t.stop();

	assertEquals(log.length, 3);

	// cleanup
	unsub();

	assertEquals(t.getInterval(), 10);
});

Deno.test("tick sleep unsub", async () => {
	const t = createTicker(() => 10);
	const log: number[] = [];

	const unsub = t.subscribe((v) => log.push(v));

	t.start();

	await sleep(15);
	unsub();

	// 0, ts, ts
	assertEquals(log.length, 3);

	// starting again must have no effect, since we're unsubscribed
	t.start();
	assertEquals(log.length, 3);

	// cleanup
	t.stop();
});

Deno.test(
	{ name: "raf ticker", sanitizeOps: false, sanitizeResources: false },
	async () => {
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
		assertEquals(log.length, 4);
	},
);

Deno.test(
	{ name: "tick sleep stop start", sanitizeOps: false, sanitizeResources: false },
	async () => {
		const t = createTicker(10);
		const log: number[] = [];

		const unsub = t.subscribe((v) => log.push(v));

		t.start();
		await sleep(15);
		t.stop();

		// 0, ts, ts, 0
		assertEquals(log.length, 4);

		// starting again must have effect
		t.start();

		assertEquals(log.length, 5);

		// cleanup
		t.stop();
		unsub();
	},
);

Deno.test("multiple subs", async () => {
	const t = createTicker(10);
	const log1: number[] = [];
	const log2: number[] = [];

	const unsub1 = t.subscribe((v) => log1.push(v));
	const unsub2 = t.subscribe((v) => log2.push(v));

	t.start();
	await sleep(19);
	unsub1();

	await sleep(19);

	// cleanup - stop before unsubscribing to ensure no leaks
	t.stop();
	unsub2();

	// 0, ts, ts (timing may vary slightly)
	assertEquals(log1.length >= 3 && log1.length <= 4, true);

	// 0, ts, ts, ts, ts, 0 (stop emits 0) - timing may vary slightly
	assertEquals(log2.length >= 6 && log2.length <= 7, true);
});

Deno.test("chain api", () => {
	const t = createTicker(10);
	const log: number[] = [];
	t.start().subscribe((v) => log.push(v))();
	assertEquals(log.length, 1);
	t.stop();
});

Deno.test("test from subscribe", async () => {
	const _log: any[] = [];
	const t = createTicker(5, false, (v: any) => _log.push(v));
	let i = 0;

	const unsub = t.subscribe((v) => {
		if (!v) return;
		if (i++ === 3) t.stop();
		// clog(i);
	});

	t.start();
	await sleep(100);
	t.stop();
	unsub();

	assertEquals(i, 4);
	assertEquals(_log.length, 3);
});
