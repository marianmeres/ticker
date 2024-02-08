type Interval = number | ((previous: number, storeVal: any) => number);
interface Ticker {
    subscribe: (cb: (timestamp: number) => void) => CallableFunction;
    start: () => Ticker;
    stop: () => Ticker;
    setInterval: (msOrFn: Interval) => Ticker;
}
export declare const createTicker: (interval?: Interval, start?: boolean, logger?: any) => Ticker;
interface DelayedTickerVal {
    started: number;
    finished: number;
    error: any;
    result: any;
}
interface DelayedWorkerTicker {
    subscribe: (cb: (previous: DelayedTickerVal) => void) => CallableFunction;
    start: () => DelayedWorkerTicker;
    stop: () => DelayedWorkerTicker;
    setInterval: (ms: Interval) => DelayedWorkerTicker;
}
export declare const createDelayedWorkerTicker: (worker: CallableFunction, interval?: Interval, start?: boolean) => DelayedWorkerTicker;
export {};
