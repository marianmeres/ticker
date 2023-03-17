# @marianmeres/ticker

Do something when it ticks.

Effectively just like a `setInterval` with a friendlier and
[store compatible](https://github.com/marianmeres/store) API.

Technical detail: under the hood this uses just plain and "stupid" [recursive `setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/setInterval#ensure_that_execution_duration_is_shorter_than_interval_frequency),
which means that it guarantees the **delay** between the calls, not the actual **frequency**.
It is good enough for general application use cases but it may not be the best
option for specific needs where you need to rely on high resolution frequency accuracy
(e.g. animations).

It will be improved in future version.

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
