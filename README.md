# @marianmeres/ticker

Do something when it ticks. With a [store compatible](https://github.com/marianmeres/store) API.

Under the hood it uses recursive `setTimeout` with interval corrections,
so it should guarantee the precise frequency **except** for the edge cases where the synchronous
subscriber's work cannot keep up with the interval - it will never tick sooner before it
finishes.

If you need to do an asynchronous periodical job with potentially greater latency than
the defined interval (such as a http request every x seconds) you should rather use
the [simpler approach which quarantees the delay, not the frequency](https://developer.mozilla.org/en-US/docs/Web/API/setInterval#ensure_that_execution_duration_is_shorter_than_interval_frequency).

## Install
```shell
$ npm i @marianmeres/ticker
```

## Usage

```typescript
// once started, will tick every 1000 milliseconds
const t = createTicker(1_000);

// basic control api
t.start();
t.stop();

// decrease/increase frequency on existing instance
t.setInterval(ms);

// subscribe api
const unsub = t.subscribe((timestamp) => {
    if (timestamp) {
        // do something on tick
    } else {
        // ticker is stopped
    }
});
```
