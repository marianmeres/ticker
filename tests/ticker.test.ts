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

		// Wait long enough for at least one scheduled tick after the immediate start tick
		// RAF polyfill runs at ~16.67ms, plus we need time for the setTimeoutRAF scheduling
		await sleep(50);
		t.stop();
		unsub();

		// 0 (factory), num (start tick), num (second tick), 0 (stop)
		assertEquals(log.length, 4);
	},
);

Deno.test(
	{ name: "raf ticker multiple ticks", sanitizeOps: false, sanitizeResources: false },
	async () => {
		const t = createTickerRAF(20); // 20ms interval
		const log: number[] = [];

		const unsub = t.subscribe((v) => log.push(v));

		t.start();

		// Wait for multiple ticks - should get at least 4-5 ticks in 100ms with 20ms interval
		await sleep(100);
		t.stop();
		unsub();

		// Should have: 0 (factory), start tick, multiple subsequent ticks, 0 (stop)
		// With 100ms wait and 20ms interval, expect at least 5 ticks (100/20) plus initial 0 and final 0
		// Being conservative: at least 4 total entries (0, tick, tick, 0)
		assertEquals(log.length >= 4, true, `Expected at least 4 ticks, got ${log.length}: ${JSON.stringify(log)}`);

		// Verify first is 0 (initial), last is 0 (stop), and middle values are timestamps
		assertEquals(log[0], 0, "First value should be 0 (initial state)");
		assertEquals(log[log.length - 1], 0, "Last value should be 0 (stopped state)");

		// All middle values should be positive timestamps
		for (let i = 1; i < log.length - 1; i++) {
			assertEquals(log[i] > 0, true, `Tick ${i} should be a positive timestamp, got ${log[i]}`);
		}
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
