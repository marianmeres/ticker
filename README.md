# @marianmeres/ticker

Do something when it ticks. With a [store compatible](https://github.com/marianmeres/store) API.

Under the hood it uses recursive `setTimeout` with interval corrections,
so it should guarantee the precise frequency **except** for the edge cases where the synchronous
subscriber's work cannot keep up with the interval - it will never tick sooner before it
finishes.

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
        // ticker is stopped (or has not started yet)
    }
});
```
