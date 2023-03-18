# @marianmeres/ticker

Do something when it ticks.

Effectively just like a `setInterval` with a friendlier and
[store compatible](https://github.com/marianmeres/store) API.

Under the hood it uses [recursive `setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/setInterval#ensure_that_execution_duration_is_shorter_than_interval_frequency)
with delay corrections, so it should guarantee the frequency.

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
