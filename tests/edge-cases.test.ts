import { assertEquals, assertThrows } from "@std/assert";
import {
	createDelayedWorkerTicker,
	createTicker,
	createTickerRAF,
} from "../src/create-ticker.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// =============================================================================
// Invalid interval tests
// =============================================================================

Deno.test("throws on zero interval", () => {
	assertThrows(
		() => createTicker(0),
		TypeError,
		"Invalid interval",
	);
});

Deno.test("throws on negative interval", () => {
	assertThrows(
		() => createTicker(-100),
		TypeError,
		"Invalid interval",
	);
});

Deno.test("throws on NaN interval", () => {
	assertThrows(
		() => createTicker(NaN),
		TypeError,
		"Invalid interval",
	);
});

Deno.test("throws on invalid interval from function", () => {
	// The error now happens at creation time since we validate the initial interval
	assertThrows(
		() => createTicker(() => -1),
		TypeError,
		"Invalid interval",
	);
});

// =============================================================================
// setInterval while running tests
// =============================================================================

Deno.test("setInterval while running changes frequency", async () => {
	const t = createTicker(10);
	const log: number[] = [];
	const unsub = t.subscribe((v) => log.push(v));

	t.start();
	await sleep(25);

	// Change interval to longer
	t.setInterval(50);
	const countBefore = log.length;

	await sleep(30);
	const countAfter = log.length;

	t.stop();
	unsub();

	// With 50ms interval, we should have fewer ticks in 30ms
	// (at most 1 more tick vs 3+ with 10ms interval)
	assertEquals(countAfter - countBefore <= 2, true);
});

// =============================================================================
// Toggle tests
// =============================================================================

Deno.test("toggle starts stopped ticker", () => {
	const t = createTicker(10);
	assertEquals(t.isStarted(), false);

	t.toggle();
	assertEquals(t.isStarted(), true);

	t.stop();
});

Deno.test("toggle stops started ticker", () => {
	const t = createTicker(10);
	t.start();
	assertEquals(t.isStarted(), true);

	t.toggle();
	assertEquals(t.isStarted(), false);
});

// =============================================================================
// isStarted tests
// =============================================================================

Deno.test("isStarted reflects correct state", () => {
	const t = createTicker(10);

	assertEquals(t.isStarted(), false);

	t.start();
	assertEquals(t.isStarted(), true);

	t.stop();
	assertEquals(t.isStarted(), false);

	// Start with autostart
	const t2 = createTicker(10, true);
	assertEquals(t2.isStarted(), true);
	t2.stop();
});

// =============================================================================
// Multiple start/stop calls
// =============================================================================

Deno.test("multiple start calls are safe", async () => {
	const t = createTicker(10);
	const log: number[] = [];
	const unsub = t.subscribe((v) => log.push(v));

	t.start();
	t.start(); // Should be no-op
	t.start(); // Should be no-op

	await sleep(15);
	t.stop();
	unsub();

	// Should behave normally, not create multiple timers
	assertEquals(log.length >= 2 && log.length <= 4, true);
});

Deno.test("multiple stop calls are safe", () => {
	const t = createTicker(10);
	t.start();

	// Should not throw
	t.stop();
	t.stop();
	t.stop();

	assertEquals(t.isStarted(), false);
});

// =============================================================================
// Subscriber error handling
// =============================================================================

Deno.test(
	{
		name: "subscriber error does not break ticker",
		sanitizeOps: false,
		sanitizeResources: false,
	},
	async () => {
		// Silence console.error from pubsub during this test
		const originalError = console.error;
		console.error = () => {};

		try {
			const t = createTicker(10);
			let tickCount = 0;

			const unsub = t.subscribe((v) => {
				if (v) {
					tickCount++;
					if (tickCount === 1) {
						throw new Error("Subscriber error!");
					}
				}
			});

			t.start();
			await sleep(35);
			t.stop();
			unsub();

			// Ticker should continue despite error on first tick
			assertEquals(tickCount >= 2, true);
		} finally {
			// Restore console.error
			console.error = originalError;
		}
	},
);

Deno.test(
	{
		name: "onError handler receives subscriber errors",
		sanitizeOps: false,
		sanitizeResources: false,
	},
	async () => {
		const errors: unknown[] = [];
		const t = createTicker(10, {
			onError: (err) => errors.push(err),
		});
		let tickCount = 0;

		const unsub = t.subscribe((v) => {
			if (v) {
				tickCount++;
				if (tickCount === 1) {
					throw new Error("Custom error!");
				}
			}
		});

		t.start();
		await sleep(35);
		t.stop();
		unsub();

		// Error should have been captured by our handler
		assertEquals(errors.length, 1);
		assertEquals((errors[0] as Error).message, "Custom error!");
		// Ticker should continue despite error
		assertEquals(tickCount >= 2, true);
	},
);

// =============================================================================
// Dynamic interval function tests
// =============================================================================

Deno.test("interval function receives previous interval", async () => {
	const receivedPrevious: number[] = [];

	const t = createTicker((prev) => {
		receivedPrevious.push(prev);
		return 10;
	});

	const unsub = t.subscribe(() => {});
	t.start();
	await sleep(35);
	t.stop();
	unsub();

	// First call should receive the initial interval (10)
	assertEquals(receivedPrevious.length >= 2, true);
});

Deno.test("interval function can vary interval", async () => {
	let callCount = 0;
	const t = createTicker(() => {
		callCount++;
		return callCount <= 2 ? 5 : 20;
	});

	const log: number[] = [];
	const unsub = t.subscribe((v) => {
		if (v) log.push(v);
	});

	t.start();
	await sleep(50);
	t.stop();
	unsub();

	// Should have more ticks initially (5ms) then slow down (20ms)
	assertEquals(log.length >= 3, true);
});

// =============================================================================
// Autostart tests
// =============================================================================

Deno.test("autostart parameter works", async () => {
	const log: number[] = [];
	const t = createTicker(10, true); // autostart = true
	const unsub = t.subscribe((v) => log.push(v));

	await sleep(15);
	t.stop();
	unsub();

	// Should have ticked automatically
	assertEquals(log.length >= 2, true);
});

// =============================================================================
// Large interval tests
// =============================================================================

Deno.test("large interval is accepted", () => {
	const t = createTicker(60000); // 1 minute
	assertEquals(t.getInterval(), 60000);
});

// =============================================================================
// Delayed worker ticker edge cases
// =============================================================================

Deno.test("delayed worker toggle works", () => {
	const t = createDelayedWorkerTicker(() => "result", 10);

	assertEquals(t.isStarted(), false);
	t.toggle();
	assertEquals(t.isStarted(), true);
	t.toggle();
	assertEquals(t.isStarted(), false);
});

Deno.test("delayed worker setInterval while running", async () => {
	let callCount = 0;
	const t = createDelayedWorkerTicker(() => ++callCount, 10);

	t.start();
	await sleep(25);
	t.setInterval(100); // Change to much longer interval

	const countAtChange = callCount;
	await sleep(50);

	t.stop();

	// Should have very few additional calls after interval change
	assertEquals(callCount - countAtChange <= 1, true);
});

Deno.test("delayed worker with sync function", async () => {
	let callCount = 0;
	const t = createDelayedWorkerTicker(() => ++callCount, 10); // Sync function

	const log: any[] = [];
	const unsub = t.subscribe((v) => log.push(v));

	t.start();
	await sleep(35);
	t.stop();
	unsub();

	assertEquals(callCount >= 2, true);
});

// =============================================================================
// RAF ticker tests
// =============================================================================

Deno.test(
	{
		name: "RAF ticker with polyfill works",
		sanitizeOps: false,
		sanitizeResources: false,
	},
	async () => {
		const t = createTickerRAF(20);
		const log: number[] = [];
		const unsub = t.subscribe((v) => log.push(v));

		t.start();
		await sleep(60);
		t.stop();
		unsub();

		// Should have multiple ticks
		assertEquals(log.length >= 3, true);
	},
);

// =============================================================================
// Chaining API tests
// =============================================================================

Deno.test("all methods return ticker for chaining", () => {
	const t = createTicker(10);

	// All these should return the ticker instance
	const result1 = t.start();
	assertEquals(result1, t);

	const result2 = t.stop();
	assertEquals(result2, t);

	const result3 = t.toggle();
	assertEquals(result3, t);

	const result4 = t.setInterval(20);
	assertEquals(result4, t);

	t.stop();
});

Deno.test("complex chaining works", () => {
	const log: number[] = [];

	const t = createTicker(10)
		.setInterval(20)
		.start();

	const unsub = t.subscribe((v) => log.push(v));

	// Should have received initial value
	assertEquals(log.length, 1);

	t.stop();
	unsub();
});

// =============================================================================
// Stop from within subscriber
// =============================================================================

Deno.test(
	{
		name: "stop from within subscriber works",
		sanitizeOps: false,
		sanitizeResources: false,
	},
	async () => {
		const t = createTicker(5);
		let tickCount = 0;

		const unsub = t.subscribe((v) => {
			if (v) {
				tickCount++;
				if (tickCount === 3) {
					t.stop();
				}
			}
		});

		t.start();
		await sleep(100);

		unsub();

		// Should have stopped at exactly 3 ticks
		assertEquals(tickCount, 3);
		assertEquals(t.isStarted(), false);
	},
);
