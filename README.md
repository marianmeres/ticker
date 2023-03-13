# @marianmeres/ticker

Do something when it ticks.

(Effectively just a `setInterval` with a friendlier API.)

## Install
```shell
$ npm i @marianmeres/ticker
```

## Example usage

```typescript
// once started, will tick every 1000 milliseconds
const t = createTicker(1_000);

// control api
t.start();
t.stop();

// subscribe api
const unsub = t.subscribe((timestamp) => {
    if (timestamp) {
        // do something on tick
    } else {
        // ticker is stopped
    }
});
```
