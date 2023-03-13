# @marianmeres/ticker

Do something when it ticks.

Effectively just a `setInterval` with a friendlier and
[store compatible](https://github.com/marianmeres/store) API.

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
