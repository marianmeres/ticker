type Interval = number | ((previous: number, storeVal: any) => number);
interface Ticker {
    subscribe: (cb: (timestamp: number) => void) => CallableFunction;
    start: () => Ticker;
    stop: () => Ticker;
    setInterval: (msOrFn: Interval) => Ticker;
    getInterval: () => number;
}
export declare function createTicker(interval?: Interval, start?: boolean, logger?: any): Ticker;
export declare const createTickerRAF: (interval?: Interval, start?: boolean, logger?: any) => Ticker;
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
    getInterval: () => number;
}
export declare const createDelayedWorkerTicker: (worker: CallableFunction, interval?: Interval, start?: boolean) => DelayedWorkerTicker;
export {};
